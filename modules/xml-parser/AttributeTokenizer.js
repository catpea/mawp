export default class AttributeTokenizer {
  #rules = [];

  constructor() {
    this
      .addRule({ type: 'KEYWORD'}, /^(?<value>if|then|else|for|while|do|done|case|esac|in|return)/, {})
      .addRule({ type: 'IDENTIFIER'}, /^(?<value>[a-z]+)/, {})
      .addRule({ type: 'ARGUMENT'}, /^--(?<value>[a-z]+)/, {})
      .addRule({ type: 'FLAG'}, /^-(?<value>[a-z]+)/, {})
      .addRule({ type: 'NUMBER'}, /^(?<value>\d+(\.\d+)?)/, {tr:v=>Number(v)})
      .addRule({ type: 'STRING'}, /^(?<value>'((?:[^'\\]|\\.)*?)'|"((?:[^"\\]|\\.)*?)")/, {})
      .addRule({ type: 'OPERATOR'}, /^(?<value>[+\-*/%<>=!&|^])/, {})
      .addRule({ type: 'OPEN_BRACKET', enter:true}, /^(?<value>[<(\[{])/, {})
      .addRule({ type: 'CLOSE_BRACKET', exit:true}, /^(?<value>[>)\]}])/, {})
      .addRule({ type: 'PIPE'}, /^(?<value>\|)/, {})
      .addRule({ type: 'CONTROL'}, /^(?<value>;)/, {})
      .addRule({ type: 'SPACE'}, /^(?<value>\s+)/, {ignore:true})
  }

  addRule(base, expression, options = {}) {
    this.#rules.push({ base, expression, options});
    return this;
  }

  getPosition(str, index) {
      if (index === 0) return [1, 1];
      const processed = str.slice(0, index + 1);
      const split = processed.split('\n');
      const lines = split.length;
      const characters = split[lines - 1].length;
      return [lines, characters];
  }

  tokenize(xmlStr) {
    const tokens = [];
    let currentIndex = 0;
    while (currentIndex < xmlStr.length) {
      let matched = false;
      for (const { base, expression, options } of this.#rules) {
        const string = xmlStr.slice(currentIndex);
        const match = expression.exec(string);
        if (match) {

          if(match[0].length == 0) throw new Error(`Zero length match (inifinite loop) in ${base.type} at index ${currentIndex} (${this.getPosition(xmlStr, currentIndex).join(':')}) - check your rules!`);

          console.info(`parsing: ${string.substr(0,128).replace(/\n/g,'\\n')}..`)
          console.info(`match: ${match[0]}`,match)
          matched = true;
          const str = match[0];
          const len = str.length;
          const pos = this.getPosition(xmlStr, currentIndex).join(':');

          if(!options.ignore){
            const groups = Object.fromEntries( Object.entries(match.groups).map(([k, v]) => [k, v.trim()]) );
            const token = Object.assign({ ...base, pos }, groups);
            if (options.value) token.value = token[options.value];
            if (token.value && options.tr) token.value = options.tr(token.value);
            tokens.push(token);
          }
          currentIndex += len; // Move the index forward
          break; // Break out of the loop to restart with the new index
        } // if match
      } // evaluate rules
      if (!matched) {
        // If no rule matched, we have an invalid XML string section
        throw new Error(`Unexpected token "${xmlStr.slice(currentIndex).substr(0,8).replace(/\n/g,'\\n')}..." at index ${currentIndex} (${this.getPosition(xmlStr, currentIndex).join(':')})`);
      }
    }
    return tokens;
  }


}
