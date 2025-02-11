// function elementCreator(elementName, attributes, children) {
//   // Create the element using the property name as the tag
//   const element = document.createElement(elementName);

//   // Set all attributes provided in the attributes object
//   Object.entries(attributes).forEach(([key, value]) => {
//     // Handle special cases like className for 'class'
//     if (key === 'id') {
//       element.id = value;
//     } else if (key === 'class') {
//       element.className = value;


//     } else if (key === 'SPECIAL KEY') {
//     //TODO: HANDLE ALL SPECIAL CASES
//     // TODO UNIQUE KEY HANDLING HERE
//     }

//     else if (key === 'style') {
//       // TODO: convert JavaScript Object To CSS Style, and apply it to the "element" DOM node;
//     } else {
//       // Set the attribute if value is defined
//       if (value !== undefined) {
//         element.setAttribute(key, value);
//       }
//     }
//   });

//   for (const child of children) {
//     element.appendChild(child)
//   }

//   return element;

// }

function elementCreator(elementName, attributes, children) {
  // Create the element using the property name as the tag
  const element = document.createElement(elementName);

  // Set all attributes provided in the attributes object
  Object.entries(attributes).forEach(([key, value]) => {
    if (value === undefined) return; // Skip undefined values

    switch (key) {
      // Special class handling
      case 'class':
        if(Array.isArray(value)) value = value.join(' ');
        const payload = value.split(' ').filter(o=>o);
        //console.log('LOL', payload)
        element.classList.add(...payload);
        break;

      // Special ID handling
      case 'id':
        element.id = value;
        break;

      // Style object handling
      case 'style':
        if (typeof value === 'object') {
          Object.entries(value).forEach(([prop, val]) => {
            // Convert camelCase to kebab-case
            const cssProperty = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
            element.style[cssProperty] = val;
          });
        } else {
          element.setAttribute('style', value);
        }
        break;

      // Dataset (data-*) attributes
      case 'dataset':
        Object.entries(value).forEach(([dataKey, dataValue]) => {
          element.dataset[dataKey] = dataValue;
        });
        break;

      // Event listeners
      case 'on':
        if (typeof value === 'object') {
          Object.entries(value).forEach(([event, handler]) => {
            element.addEventListener(event, handler);
          });
        }
        break;

      // innerHTML handling
      case 'innerHTML':
        element.innerHTML = value;
        break;

      // textContent handling
      case 'textContent':
        element.textContent = value;
        break;

      // Value property
      case 'value':
        element.value = value;
        break;

      // Checked property for checkboxes and radio buttons
      case 'checked':
        element.checked = value;
        break;

      // Selected property for option elements
      case 'selected':
        element.selected = value;
        break;

      // Disabled property
      case 'disabled':
        element.disabled = value;
        break;

      // Name attribute
      case 'name':
        element.name = value;
        break;

      // Href for anchors
      case 'href':
        element.href = value;
        break;

      // Src for images, scripts, etc.
      case 'src':
        element.src = value;
        break;

      // Type attribute
      case 'type':
        element.type = value;
        break;

      // For form elements
      case 'placeholder':
        element.placeholder = value;
        break;

      // Default case for regular attributes
      default:
        element.setAttribute(key, value);
    }
  });

  // Append children
  for (const child of children) {
    if (child instanceof Node) {
      element.appendChild(child);
    } else if (typeof child === 'string' || typeof child === 'number') {
      element.appendChild(document.createTextNode(String(child)));
    }
  }

  return element;
}

// Create the proxy handler
const handler = {
  get: (target, elementName) => {
    // Return a function that creates the element with the given property name
    return (attributes = {}, ...children) => {
      return elementCreator(elementName, attributes, children);
    };
  }
};

// Create the proxy
const lol = new Proxy({}, handler);
export default lol;
