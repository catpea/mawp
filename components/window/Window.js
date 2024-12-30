import config from 'system-configuration';
import Signal from 'signal';

import Dataset from 'dataset';

export default class Window extends HTMLElement {
    constructor() {
      // establish prototype chain
      super();
      this.status = new Signal('loading');

      this.dataset2 = new Dataset();

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
          </div>

          <ul class="list-group list-group-flush">
            <li class="list-group-item">
              <${config.prefix}-port id="port-in" data-title="In" data-side="start" data-icon="circle"></${config.prefix}-port>
              <${config.prefix}-port id="port-out" data-title="Out" data-side="end" data-icon="circle"></${config.prefix}-port>
            </li>
            <li class="list-group-item">A second item</li>
          </ul>


          <div class="card-footer text-body-secondary">
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

      // const cardIO = shadow.querySelector('.list-group-item:first');







    }



    connectedCallback() {
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
      this.observer.observe(this, { attributes: true });
      this.gc = ()=> observer.disconnect();

      for (const {name, value} of this.attributes) {
        // console.log('CCCCCX', name, value);
        if (name.startsWith('data-')) {
          this.dataset2.set(name.split('-')[1], this.getAttribute(name));
        }
      }
      this.status.value = 'ready';
    }

  getPortElement(id) {
    return this.shadowRoot.querySelector(`#port-${id}`);
  }


  }
