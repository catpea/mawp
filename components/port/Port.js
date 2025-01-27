import Dataset from 'dataset';
import Connectable from './Connectable.js';

import transcend from 'transcend';

export default class Port extends HTMLElement {
    constructor() {
      // establish prototype chain
      super();

      this.dataset2 = new Dataset();

      const shadow = this.attachShadow({ mode: 'open' });
      shadow.adoptedStyleSheets = document.adoptedStyleSheets;

      const portNode = document.createElement('div');

      portNode.innerHTML = `
        <span></span>
        <span class="position-absolute top-50 translate-middle badge rounded-pill p-1"><i class="bi"></i></span>
      `;

      shadow.appendChild(portNode);

      const portComponents = shadow.querySelectorAll('span');
      const portLabel = portComponents[0];

      const portSticker = portComponents[1];

      this.changePortStyle(portSticker, 'solid-primary')
      this.dataset2.get('style').subscribe(newStyle => this.changePortStyle(portSticker, newStyle));

      const portIcon = shadow.querySelector('.bi');


      const connectable = new Connectable(this);
      this.gc = connectable.start();

      // UPDATE PORT ID
      this.dataset2.get('name').subscribe(v => portSticker.id = v);
      this.dataset2.get('title').subscribe(v => portLabel.textContent = v);

      // UPDATE START/END POSITION
      this.dataset2.get('side').subscribe(v => {
        if (v === 'in') {
          portLabel.classList.remove('float-end');
          portLabel.classList.add('float-start');
          portSticker.classList.remove('start-100')
          portSticker.classList.add('start-0')
        } else {
          portLabel.classList.remove('float-start');
          portLabel.classList.add('float-end');
          portSticker.classList.remove('start-0')
          portSticker.classList.add('start-100')
        }
      });

      // UPDATE ICON
      this.dataset2.get('icon').subscribe(v => {
        portIcon.classList.remove(...Array.from(portIcon.classList).filter(className => className.startsWith('bi-')) )
        portIcon.classList.add(`bi-${v}`);
      });

    }

    // fires after the element has been attached to the DOM
    connectedCallback() {

      const handleMutations = (mutationsList) => {
         for (let mutation of mutationsList) {
           if (mutation.type === 'attributes' && mutation.attributeName.startsWith('data-')) {
             const attributeName = mutation.attributeName;
             const newValue = mutation.target.getAttribute(attributeName);
             this.dataset2.set(attributeName.substr(5), newValue);
           }
         }
       }
      this.observer = new MutationObserver(handleMutations);
      this.observer.observe(this, { attributes: true });
      this.gc = ()=> observer.disconnect();

      for (const {name, value} of this.attributes) {
        if (name.startsWith('data-')) {
          this.dataset2.set(name.substr(5), this.getAttribute(name));
        }
      }




    }





    get application(){
      return transcend(this, `x-application`);
    }

    get scene(){
      //console.log('SCENE REQUEST', transcend(this, `x-scene`) )
      return transcend(this, `x-scene`);
    }

    get window(){
      return transcend(this, `x-window`);
    }


    getDecal() {
      return this.shadowRoot.querySelector('.bi');
    }

    // GARBAGE COLLECTION

    #garbage = [];
    collectGarbage(){
      this.#garbage.map(s=>s.subscription())
    }

    set gc(subscription){ // shorthand for component level garbage collection
      this.#garbage.push( {type:'gc', id:'gc-'+this.#garbage.length, ts:(new Date()).toISOString(), subscription} );
    }

// STYLE MANAGEMENT
  #previousStyle = null;
  changePortStyle(element, newStyle){
    if(this.#previousStyle) CardStyles.remove(element, this.#previousStyle);
    CardStyles.add(element, newStyle);
    this.#previousStyle = newStyle;
  }
}

class CardStyles {
  static styles = {
    'data': ['text-bg-primary'],
    'event': ['text-bg-success'],
    'setting': ['text-bg-info'],

    'solid-primary': ['text-bg-primary'],
    'solid-secondary': ['text-bg-secondary'],
    'solid-success': ['text-bg-success'],
    'solid-danger': ['text-bg-danger'],
    'solid-warning': ['text-bg-warning'],
    'solid-info': ['text-bg-info'],
    'solid-light': ['text-bg-light'],
    'solid-dark': ['text-bg-dark'],
    'border-primary': ['border-primary'],
    'border-secondary': ['border-secondary'],
    'border-success': ['border-success'],
    'border-danger': ['border-danger'],
    'border-warning': ['border-warning'],
    'border-info': ['border-info'],
    'border-light': ['border-light'],
    'border-dark': ['border-dark'],
  }

  static remove(element, styleName){
    if(!this.styles[styleName]) return; //NOTE: nominal/none/* style will be skipped here
    const styleClasses = this.styles[styleName];
    styleClasses.forEach(o=>element.classList.remove(o));
  }

  static add(element, styleName){
    if(!this.styles[styleName]) return; //NOTE: nominal/none/* style will be skipped here
    const styleClasses = this.styles[styleName];
    styleClasses.forEach(o=>element.classList.add(o));
  }

}
