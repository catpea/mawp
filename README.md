MAWP
---

## TODO

- add this.gc/listenTo to all the .subscribeToValue
- tonejs read only components myst be destroyed-and-re-created
- restore focus
- restore sending options to tone js objects

- style guard: ensure user methods are not called directly but via state machine
- switch all to ReactiveHTMLElement for consistemt garbage collection
- receive function
- resize windows
- "lol" library, on has no garbage collection
- clear selection on scene change
- redo deleting, selecting, perhaps bubble events up to the scene...Capture this as operations at UI vs. VFS
- add this.gc = to all subscriptions
- live update (signal) inner pipes, test by adding upper to upper and watch it live
- Save load files
- enable pipe connections
- add an editor modal

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


## Transforming x and y under scene scale, panX and panY

### Using the built in transformer

```JavaScript
    // GET REAL COORDIANTES
    let currentX = event.clientX;
    let currentY = event.clientY;

    // TRANSFORM
    [currentX, currentY] = this.portComponent.scene.transform(currentX, currentY);
```

### Using the manual procedure
```JavaScript

    // GET REAL COORDIANTES
    let currentX = event.clientX;
    let currentY = event.clientY;

    // GET SCALE INFORMATION
    const scale = this.portComponent.scene.scale.value;
    let panX = this.portComponent.scene.panX.value;
    let panY = this.portComponent.scene.panY.value;

    // TRANSFORM BY SCALE
    currentX = currentX / scale;
    currentY = currentY / scale;

    // TRANSFORM BY PAN (note that you must first transform pan)
    panX = panX / scale;
    panY = panY / scale;
    currentX = currentX - panX;
    currentY = currentY - panY;

```

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

## Class Name Ideas

### 1. **User Interface (UI) Components:**
- Button
- TextField
- Label
- Checkbox
- RadioButton
- Dropdown
- DatePicker
- Slider
- Navbar
- Footer
- Modal
- Card
- List
- Grid
- Table
- Tooltip

### 2. **Navigation and Routing:**
- Router
- Route
- Link
- NavLink
- Switch

### 3. **State Management:**
- Store
- Reducer
- Action
- Dispatcher
- Provider
- Consumer
- Context

### 4. **Data Handling:**
- Model
- Controller
- Repository
- Service
- Entity
- DTO (Data Transfer Object)
- DAO (Data Access Object)
- API (Application Programming Interface)

### 5. **Security and Authentication:**
- Auth
- User
- Role
- Permission
- Token
- Session
- Cookie

### 6. **Networking:**
- Request
- Response
- HttpClient
- Fetch
- WebSocket
- Socket

### 7. **Utilities and Helpers:**
- Utils
- Helpers
- Config
- Logger
- Validator
- Formatter
- Converter

### 8. **Testing:**
- Test
- Suite
- Spec
- Mock
- Stub
- Fixture

### 9. **Errors and Exceptions:**
- Error
- Exception
- Handler

### 10. **Media and Files:**
- Image
- Video
- Audio
- File
- Upload
- Download
- Stream

### 11. **Components and Widgets:**
- Widget
- Component
- Module
- Directive (in Angular)
- PartialView

### 12. **Database and Persistence:**
- DB (Database)
- Table
- Row
- Column
- Query
- Schema
- Migration

### 13. **Performance and Optimization:**
- Cache
- LoadBalancer
- Minifier
- Compressor

### 14. **Internationalization (i18n) and Localization (l10n):**
- Locale
- Translation
- Language

### 15. **Notifications and Messaging:**
- Alert
- Message
- Notification
- Mailer
- SMS
- Push
