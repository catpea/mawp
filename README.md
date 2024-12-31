MAWP
---

## Server
- server.js

## Browser
- browser.js


## Two Tier Architecture

### User Interface Rendering

1. Zooming User Interface & SVG Drawing Support
  - dom-zoom custom element


### Data Model & Applicaion Control
1. Node is a Dom Element like node with enhanced functionality


## Cheatsheets

Here is a simple cheat sheet for methods related to **creating** and **removing DOM elements** in JavaScript. These methods are essential for manipulating the DOM dynamically:

### **Creating DOM Elements**
1. **`document.createElement(tagName)`**
   - Creates a new element with the specified tag name.
   - **Example**:
     ```javascript
     let newDiv = document.createElement('div');
     ```

2. **`element.setAttribute(attribute, value)`**
   - Sets an attribute on an element (like class, id, etc.).
   - **Example**:
     ```javascript
     newDiv.setAttribute('class', 'my-class');
     ```

3. **`element.appendChild(child)`**
   - Adds a child element to a parent element.
   - **Example**:
     ```javascript
     document.body.appendChild(newDiv);
     ```

4. **`document.createTextNode(text)`**
   - Creates a text node that can be appended to an element.
   - **Example**:
     ```javascript
     let textNode = document.createTextNode('Hello, world!');
     newDiv.appendChild(textNode);
     ```

5. **`element.innerHTML`**
   - Sets or retrieves HTML content inside an element.
   - **Example**:
     ```javascript
     newDiv.innerHTML = '<p>Some content</p>';
     ```

### **Removing DOM Elements**
1. **`element.remove()`**
   - Removes the element from the DOM.
   - **Example**:
     ```javascript
     newDiv.remove();
     ```

2. **`parentNode.removeChild(child)`**
   - Removes a child element from its parent node.
   - **Example**:
     ```javascript
     document.body.removeChild(newDiv);
     ```

3. **`element.innerHTML = ''`**
   - Clears the content of an element.
   - **Example**:
     ```javascript
     newDiv.innerHTML = '';
     ```

### **Example: Create and Remove Element**
```javascript
// Create a new div with text
let newDiv = document.createElement('div');
let textNode = document.createTextNode('This is a new div');
newDiv.appendChild(textNode);
document.body.appendChild(newDiv);

// Remove the div after 3 seconds
setTimeout(() => {
  newDiv.remove();
}, 3000);
```

### **Summary of Key Methods**
- **Create**: `document.createElement()`, `document.createTextNode()`, `setAttribute()`
- **Add to DOM**: `appendChild()`, `innerHTML`
- **Remove from DOM**: `remove()`, `removeChild()`, `innerHTML = ''`

This cheat sheet covers the basics for creating and removing DOM elements, which should cover most needs for dynamic page manipulation.
