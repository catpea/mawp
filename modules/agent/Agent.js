import Signal from 'signal';
import Setings from 'settings';
import State from 'state';
import guid from 'guid';

export default class Agent {

  id = guid();
  health = new Signal('nominal'); // nominal, primary, secondary, success, danger, warning, info, light, dark.
  settings = new Setings();
  state = new State();

  constructor() {
    this.initialize();
  }

  initialize(){}
  start(){}
  stop(){}

  upgrade(state, extra){}
  status(){}
  terminate(){}

  connection(port, pipe){
  }
  disconnection(port, pipe){
  }

  send(port, data, options){
    const eventName = `send:${port}`;
    this.emit(eventName, data, options);
  }
  receive(port, data, address, options){
    this.process(port, data, address, options);
  }

  // OVERLOADS
  process(port, data, address, options){
    console.error('User must provide own receive function.')
  }






  // Emitter
  subscribers = {};
  // Event handling methods
  on(event, callback) {
    // Register a callback for an event
    if (!this.subscribers[event]) {
      this.subscribers[event] = [];
    }
    this.subscribers[event].push(callback);
    return ()=>this.off(event, callback);
  }
  once(event, callback) {
    // Register a callback that is called at most once
    const onceWrapper = (...args) => {
      callback(...args);
      this.off(event, onceWrapper);
    };
    this.on(event, onceWrapper);
  }
  off(event, callback) {
    // Unregister a callback for an event
    if (!this.subscribers[event]) return;
    this.subscribers[event] = this.subscribers[event].filter(cb => cb !== callback);
  }
  emit(event, ...args) {
    // Emit an event, calling all registered callbacks
    if (!this.subscribers[event]) return;
    // Create a copy of the subscribers array to prevent issues if a callback modifies the subscribers during execution
    const subscribers = this.subscribers[event].slice();
    for (const callback of subscribers) {
      callback(...args);
    }
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
