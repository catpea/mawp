import Signal from 'signal';
import Dataset from 'dataset';

import lol from 'lol';
import transcend from 'transcend';

import Movable from './Movable.js';

export default class Window extends HTMLElement {

    // #el = {};

    constructor() {
      // establish prototype chain
      super();
      this.status = new Signal('loading');
      this.sizeSignal = new Signal([0,0]);
      this.dataset2 = new Dataset();

      // #elements: {
      // SELECTOR                    | el.GETTER ????
      //   "dblclick"                : "open",
      //   "click .icon.doc"         : "select",
      //   "contextmenu .icon.doc"   : "showMenu",
      //   "click .show_notes"       : "toggleNotes",
      //   "click .title .lock"      : "editAccessLevel",
      //   "mouseover .title .date"  : "showTooltip"
      // },
      //
      // #events: {
      //   "dblclick"                : "open",
      //   "click .icon.doc"         : "select",
      //   "contextmenu .icon.doc"   : "showMenu",
      //   "click .show_notes"       : "toggleNotes",
      //   "click .title .lock"      : "editAccessLevel",
      //   "mouseover .title .date"  : "showTooltip"
      // },




      // attaches shadow tree and returns shadow root reference
      // https://developer.mozilla.org/en-US/docs/Web/API/Element/attachShadow
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.adoptedStyleSheets = document.adoptedStyleSheets;


    }

    connectedCallback() {

      const application = transcend(this, `x-application`);
      if(!application) throw new Error('Unable to locate applicaion!')

       // creating a container for the editable-list component
      const cardNode = document.createElement('div');

      // adding a class to our container for the sake of clarity
      cardNode.classList.add('card', 'text-center', 'm-4', 'shadow', 'position-absolute');

      // creating the inner HTML of the editable list element
      cardNode.innerHTML = `
          <div class="card-header cursor-default user-select-none">
             <span class="card-title"></span>
          </div>

          <ul class="list-group list-group-flush">
            <li class="list-group-item">
              <x-port id="port-in" data-title="In" data-side="start" data-icon="circle"></x-port>
              <x-port id="port-out" data-title="Out" data-side="end" data-icon="circle"></x-port>
            </li>
          </ul>


          <div class="card-footer text-body-secondary" style="font-size: .75rem">
          </div>
      `;


      // appending the container to the shadow DOM
      this.shadowRoot.appendChild(cardNode);

      // NOTE: UPDATE VALUES HERE (hide/show should take place here as well)
      // TIP: treat the html as non-dynamic, this is not a generic template engine, it is oprimized ofr VPL UI

      const cardHeader = this.shadowRoot.querySelector('.card-header');
      const cardFooter = this.shadowRoot.querySelector('.card-footer');
      const listGroup = this.shadowRoot.querySelector('.list-group');
      const cardTitle = this.shadowRoot.querySelector('.card-header .card-title');

      this.dataset2.get('date').subscribe(v => cardFooter.textContent = v);
      this.dataset2.get('title').subscribe(v => cardTitle.textContent = v);
      this.dataset2.get('note').subscribe(v => cardFooter.textContent = v);

      this.dataset2.get('reference').subscribe(reference => {

        // Create Button
        if(reference) cardHeader.appendChild(lol.i({ class:'bi bi-pencil-square text-warning float-end cursor-pointer', on:{ click:()=> application.project.commander.sceneSelect({id:this.dataset2.get('reference').value}) }}))

        const referencedScene = application.project.get(reference);
        for( const element of referencedScene.children.filter(child=>child.dataset.get('incoming').value ) ){
          console.log(element);

          const portNode = lol['x-port']({ id: `port-${element.id}`, dataset:{title:element.dataset.get('title').value, side: 'start', icon: 'box-arrow-in-right'} });
          const listItem = lol.li({class:'list-group-item'}, portNode);
          listGroup.appendChild(listItem)
        }

      });

      this.dataset2.get('left').subscribe(v => cardNode.style.left = v + 'px');
      this.dataset2.get('top').subscribe(v => cardNode.style.top = v + 'px');
      this.dataset2.get('width').subscribe(v => cardNode.style.width = v + 'px');
      this.dataset2.get('height').subscribe(v => cardNode.style.height = v + 'px');

      // const cardIO = shadow.querySelector('.list-group-item:first');


      const movable = new Movable(this);
      this.gc = movable.start();

      this.observer = new MutationObserver(this.#handleAttributeMutations.bind(this));
      this.observer.observe(this, { attributes: true });
      this.gc = ()=> observer.disconnect();

      for (const {name, value} of this.attributes) {
        // console.log('CCCCCX', name, value);
        if (name.startsWith('data-')) {
          this.dataset2.set(name.split('-')[1], this.getAttribute(name));
        }
      }




      // SIZE SIGNAL
      // Create a ResizeObserver instance
      const resizeObserver = new ResizeObserver(this.#handleResizeMutation.bind(this));
      // Start observing the target element
      const card = this.shadowRoot.querySelector(`.card`);
      //
      resizeObserver.observe(card);
      this.gc = ()=> resizeObserver.disconnect();







      this.status.value = 'ready';
    }


    disconnectedCallback() {
      this.status.value = 'unloaded';
    }




    #handleAttributeMutations(mutationsList) {
      for (let mutation of mutationsList) {
        if (mutation.type === 'attributes' && mutation.attributeName.startsWith('data-')) {
          const attributeName = mutation.attributeName;
          const newValue = mutation.target.getAttribute(attributeName);
          // console.log('SET ATTRIBUTE', attributeName, newValue);
          this.dataset2.set(attributeName.split('-')[1], newValue);
        }
      }
    }

    #handleResizeMutation(entries) {
      for (let entry of entries) {
        const width = entry.contentRect.width;
        const height = entry.contentRect.height;
        // console.log(`Element resized:`, [width, height]);
        this.sizeSignal.value = [width, height];
      }
    }

  getPortElement(id) {
    return this.shadowRoot.querySelector(`#port-${id}`);
  }

  // GARBAGE COLLECTION

  #garbage = [];
  collectGarbage(){
    this.#garbage.map(s=>s.subscription())
  }

  set gc(subscription){ // shorthand for component level garbage collection
    this.#garbage.push( {type:'gc', id:'gc-'+this.#garbage.length, ts:(new Date()).toISOString(), subscription} );
  }
  }
