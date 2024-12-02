## AttributeTokenizer

### Key Features of `AttributeTokenizer`
1. **Rule-Based Tokenization**:
   - The tokenizer uses a rules-based approach by storing a collection of rules that map token types to regex patterns. This makes it easy to add, modify, or remove token types in the future.
   - Each rule includes a regex expression, a basic type, and options for further processing (like transformations and whether to ignore certain matches).

2. **Named Capture Groups**:
   - Using named capture groups within regex patterns allows for easy extraction of token values during matching.

3. **Position Tracking**:
   - The `getPosition` method provides a means to track the character and line position of tokens in the input string, which is useful for debugging when an error occurs.

4. **Error Handling**:
   - The implementation includes error handling that reports unmatched tokens or zero-length matches, preventing infinite loops in the tokenizer.

5. **Whitespace Handling**:
   - The tokenizer can ignore tokens that match the whitespace pattern by utilizing the `ignore` option.

6. **Token Transformation**:
   - The ability to transform token values using a provided function in the options (e.g., converting a string number to a numerical value).
