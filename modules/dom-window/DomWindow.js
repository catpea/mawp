import SysDataset from 'sys-dataset';

export default class DomWindow extends HTMLElement {
    constructor() {
      // establish prototype chain
      super();

      this.dataset2 = new SysDataset();

      // attaches shadow tree and returns shadow root reference
      // https://developer.mozilla.org/en-US/docs/Web/API/Element/attachShadow
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.adoptedStyleSheets = document.adoptedStyleSheets;

      // creating a container for the editable-list component
      const cardNode = document.createElement('div');

      // get attribute values from getters
      const title = this.title;
      const addItemText = this.addItemText;
      const listItems = this.items;

      // adding a class to our container for the sake of clarity
      cardNode.classList.add('card', 'text-center', 'm-4', 'shadow');

      // creating the inner HTML of the editable list element
      cardNode.innerHTML = `
          <div class="card-header">
            Featured11
          </div>

          <div class="card-body">
            <h5 class="card-title">Special title treatment</h5>
            <p class="card-text">With supporting text below as a natural lead-in to additional content.</p>
          </div>

          <div class="card-footer text-body-secondary">
            2 days ago
          </div>
      `;


      // TODO: Add mouse services!!!!!
      console.warn('ADD MOUSE SERVICES HERE!!!');
      // binding methods
      // this.addListItem = this.addListItem.bind(this);
      // this.handleRemoveItemListeners = this.handleRemoveItemListeners.bind(this);
      // this.removeListItem = this.removeListItem.bind(this);

      // appending the container to the shadow DOM
      shadow.appendChild(cardNode);

      // NOTE: UPDATE VALUES HERE (hide/show should take place here as well)
      // TIP: treat the html as non-dynamic, this is not a generic template engine, it is oprimized ofr VPL UI

      const cardHeader = shadow.querySelector('.card-header');
      const cardFooter = shadow.querySelector('.card-footer');

      this.dataset2.get('date').subscribe(v => cardFooter.textContent = v);
      this.dataset2.get('title').subscribe(v => cardHeader.textContent = v);








    }

    // add items to the list
    addListItem(e) {
      const textInput = this.shadowRoot.querySelector('.add-new-list-item-input');

      if (textInput.value) {
        const li = document.createElement('li');
        const button = document.createElement('button');
        const childrenLength = this.itemList.children.length;

        li.textContent = textInput.value;
        button.classList.add('editable-list-remove-item', 'icon');
        button.innerHTML = '&ominus;';

        this.itemList.appendChild(li);
        this.itemList.children[childrenLength].appendChild(button);

        this.handleRemoveItemListeners([button]);

        textInput.value = '';
      }
    }

    // fires after the element has been attached to the DOM
    connectedCallback() {
      // const removeElementButtons = [...this.shadowRoot.querySelectorAll('.editable-list-remove-item')];
      // const addElementButton = this.shadowRoot.querySelector('.editable-list-add-item');

      // this.itemList = this.shadowRoot.querySelector('.item-list');

      // this.handleRemoveItemListeners(removeElementButtons);
      // // addElementButton.addEventListener('click', this.addListItem, false);
      //

      const handleMutations = (mutationsList) => {
         for (let mutation of mutationsList) {
           if (mutation.type === 'attributes' && mutation.attributeName.startsWith('data-')) {
             const attributeName = mutation.attributeName;
             const newValue = mutation.target.getAttribute(attributeName);
             // console.log('SET ATTRIBUTE', attributeName, newValue);
             this.dataset2.set(attributeName.split('-')[1], newValue);
           }
         }
       }
      this.observer = new MutationObserver(handleMutations);
      const config = { attributes: true };
      this.observer.observe(this, config);
      this.gc = ()=> observer.disconnect();

      for (const {name, value} of this.attributes) {
        // console.log('CCCCCX', name, value);
        if (name.startsWith('data-')) {
          this.dataset2.set(name.split('-')[1], this.getAttribute(name));
        }
      }



      // console.log("this.dataset2.get('title')", this.dataset2.get('title').value);


    }

    // attributeChangedCallback(attributeName, oldValue, newValue) {
    //   console.log('CCCCC2222222X', attributeName, newValue);
    //   if (attributeName.startsWith('data-')) {

    //     this.dataset2.set(attributeName.split('-')[1], newValue);
    //   }
    //  }

    // gathering data from element attributes
    get title() {
      return this.getAttribute('title') || '';
    }

    get items() {
      const items = [];

      [...this.attributes].forEach(attr => {
        if (attr.name.includes('list-item')) {
          items.push(attr.value);
        }
      });

      return items;
    }

    get addItemText() {
      return this.getAttribute('add-item-text') || '';
    }

    handleRemoveItemListeners(arrayOfElements) {
      arrayOfElements.forEach(element => {
        element.addEventListener('click', this.removeListItem, false);
      });
    }

    removeListItem(e) {
      e.target.parentNode.remove();
    }
  }
