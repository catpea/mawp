Object.defineProperty(globalThis, 'XXX', {
  value: {
    prefix: 'xxx',
  },          // Value of the constant
  writable: false,    // Prevent modification of the constant
  enumerable: false,   // Make it enumerable (optional, for iteration)
  configurable: false // Prevent deletion or reconfiguration of the constant
});

import XmlParser from './modules/xml-parser/XmlParser.js';
import AttributeTokenizer from './modules/xml-parser/AttributeTokenizer.js';




// Example usage
const tokenizer = new AttributeTokenizer();
const input = `if (x > 5) then echo "Value is greater than 5" | grep 'found';
  send bork | ggg -presto --verbose 3000;
`;
const tokens = tokenizer.tokenize(input);

console.log(tokens);

// load architecture
//  import XmlParser from 'xml-parser';
const parser = new XmlParser();
const architecture = await (await fetch('./architecture.xml')).text();
const parsedObject = parser.parse(architecture);
console.log( parsedObject );
