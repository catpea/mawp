import Dataset from 'dataset';
import Signal from 'signal';

import transcend from 'transcend';
import guid from 'guid';

/*

  Nothing special here, just a reactive dataset, and some health singals
  this class exists to eliminate code duplication, it is just something you can't avoid.

*/

export default class ReactiveHTMLElement extends HTMLElement {

  // Signals
  health; // Tells the USER that they have made a mistake while visually programming.
  status; // communicates component status with other components (whether it is loadeed or not)

  dataset2;

  // USER CONTROL:
  initialize(){}
  connected(){}
  disconnected(){
    this.collectGarbage()
  }

  constructor() {
    super();
    this.health = new Signal('nominal'); // nominal, primary, secondary, success, danger, warning, info, light, dark.
    this.status = new Signal('loading'); // loading, ready, unloaded;
    this.dataset2 = new Dataset(); // reactive dataset
    this.initialize();
  }

  connectedCallback() {
    this.#initializeReactiveDataset();
    this.connected();
  }

  disconnectedCallback() {
    this.disconnected();
    this.collectGarbage();
  }

  #initializeReactiveDataset() {
    this.observer = new MutationObserver(this.#handleAttributeMutations.bind(this));
    this.observer.observe(this, { attributes: true });
    this.gc = ()=> this.observer.disconnect();

    // SEED DATASET2 WITH WebComponent Attributes
    for (const {name: attributeName, value: attributeValue} of this.attributes) {
      if (attributeName.startsWith('data-')) {
        const keyName = attributeName.substr(5); // remove "data-" prefix
        this.dataset2.set(keyName, attributeValue);
      }
    }
  }
  #handleAttributeMutations(mutationsList) {
    for (let mutation of mutationsList) {
      if (mutation.type === 'attributes' && mutation.attributeName.startsWith('data-')) {
        const attributeName = mutation.attributeName;
        const newValue = mutation.target.getAttribute(attributeName);
        //console.log('SET ATTRIBUTE', attributeName.substr(5), newValue);
        this.dataset2.set(attributeName.substr(5), newValue);
      }
    }
  }

  // WORKING WITH TEMPLATES
  assignText(object, element){
    for(const [name, value] of Object.entries(object)){
      element.querySelectorAll(`[name=${name}]`).forEach(e=>e.textContent = value)
    }
  }

  // WORKING WITH STYLES
  styles(userCSS){
      const styles = [...document.adoptedStyleSheets];
      if(userCSS){
        const localCss = new CSSStyleSheet();
        localCss.replaceSync(userCSS.trim());
        styles.push(localCss)
      }
      this.shadowRoot.adoptedStyleSheets = styles;
  }

  // EVENTS
  /**
   * Attaches an event listener to an element and removes it immediately which seems to be incorrect.
   * This needs correction, typically wanting to manage both adding and removal at different times.
   *
   * @param {HTMLElement} element - The HTML element to which the event listener will be attached.
   * @param {string} event - The name of the event.
   * @param {Function} listener - The callback function that handles the event.
   * @throws {Error} if any of the parameters are not provided.
   */
  listenTo(element, event, listener){
    if (!element || !event || !listener) {
      throw new Error('All arguments (element, event, listener) must be provided');
    }
    const boundListener = listener.bind(this);
    element.addEventListener(event, boundListener);
    return ()=>element.removeEventListener(event, boundListener);
  }

  // HELPFUL GETTER METHODS
  get application(){
    return transcend(this, `x-application`);
  }
  get scene(){
    return transcend(this, `x-scene`);
  }
  get window(){
    return transcend(this, `x-window`);
  }

    // GARBAGE COLLECTED TIMEOUT
  setTimeout(timeoutFunction, timeoutDuration){
    const timeoutGuid = guid();
    const timeoutId = setTimeout(()=>{
    this.#garbage.splice(this.#garbage.findIndex(o=>o.id===timeoutGuid), 1);
    timeoutFunction();
    }, timeoutDuration);
    this.#garbage.push( {type:'timeout', id:timeoutGuid, ts:(new Date()).toISOString(), subscription: ()=>clearTimeout(timeoutId)} );
  }

  // STANDARD GARBAGE COLLECTION
  #garbage = [];
  collectGarbage(){
    this.#garbage.map(s=>s.subscription())
  }
  set gc(subscription){ // shorthand for component level garbage collection
    this.#garbage.push( {type:'gc', id:'gc-'+this.#garbage.length, ts:(new Date()).toISOString(), subscription} );
  }

}
