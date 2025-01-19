// Token types
const TOKEN_TYPE = {
  COMMAND: "COMMAND",
  FLAG: "FLAG",
  PIPE: "PIPE",
  SEMICOLON: "SEMICOLON",
};

// Tokenize the input string
function tokenize(input) {
  const tokens = [];
  // Updated regex to handle semicolons attached to other tokens
  const regex = /(--\w+|-.\w*|"[^"]*"|;|\S+)/g;
  const words = input.match(regex);

  for (let i = 0; i < words.length; i++) {
    let word = words[i];

    if (word.startsWith("--") || word.startsWith("-")) {
      // Check if the next word is a value for this flag
      if (
        i + 1 < words.length &&
        !words[i + 1].startsWith("--") &&
        !words[i + 1].startsWith("-") &&
        words[i + 1] !== "|" &&
        words[i + 1] !== ";"
      ) {
        let flagValue = words[++i].replace(/"/g, "");
        // If the flag value ends with a semicolon, separate it
        if (flagValue.endsWith(";")) {
          flagValue = flagValue.slice(0, -1);
          tokens.push({
            type: TOKEN_TYPE.FLAG,
            value: word,
            flagValue: flagValue,
          });
          tokens.push({ type: TOKEN_TYPE.SEMICOLON, value: ";" });
        } else {
          tokens.push({
            type: TOKEN_TYPE.FLAG,
            value: word,
            flagValue: flagValue,
          });
        }
      } else {
        tokens.push({ type: TOKEN_TYPE.FLAG, value: word, flagValue: null });
      }
    } else if (word === "|") {
      tokens.push({ type: TOKEN_TYPE.PIPE, value: word });
    } else if (word === ";") {
      tokens.push({ type: TOKEN_TYPE.SEMICOLON, value: word });
    } else {
      tokens.push({ type: TOKEN_TYPE.COMMAND, value: word.replace(/"/g, "") });
    }
  }

  return tokens;
}

// Parse the tokens into a syntax tree
function parse(tokens) {
  const commands = [];
  let currentCommand = null;

  for (let token of tokens) {
    switch (token.type) {
      case TOKEN_TYPE.COMMAND:
        currentCommand = {
          commandName: token.value,
          commandArguments: {},
          terminators: [],
        };
        commands.push(currentCommand);
        break;
      case TOKEN_TYPE.FLAG:
        if (currentCommand) {
          const flagName = token.value.replace(/^-+/,'');
          currentCommand.commandArguments[flagName] = token.flagValue;
          // currentCommand.flags.push({ flag: token.value, value: token.flagValue });
        } else {
          throw new Error("Flag without command");
        }
        break;
      case TOKEN_TYPE.PIPE:
        if (currentCommand) {
          currentCommand.terminators.push(token.value);
        } else {
          throw new Error("Pipe without command");
        }
        currentCommand = null; // Reset current command for the next one
        break;
      case TOKEN_TYPE.SEMICOLON:
        if (currentCommand) {
          currentCommand.terminators.push(token.value);
        } else {
          throw new Error("Semicolon without command");
        }
        currentCommand = null; // Reset current command for the next one
        break;
      default:
        throw new Error("Unknown token type");
    }
  }

  return commands;
}

export default function main(input) {
  const tokens = tokenize(input);
  const syntaxTree = parse(tokens);

  return syntaxTree;
}
