import Signal from 'signal';
import Setings from 'settings';
import State from 'state';
import guid from 'guid';

export default class Agent {

  id = guid();

  // debug is a plain object to avoid unnecessary lookups
  debug = null; // {delay:1_234}

  health = new Signal('nominal'); // nominal, primary, secondary, success, danger, warning, info, light, dark.
  alert = new Signal(); // new Signal({context:'danger', message:'There was an error in the pipe.'});

  settings = new Setings();
  state = new State();

  constructor(...a) {
    this.initialize(...a);
  }

  upgrade(process, state, extra){}

  reset(){
    this.stop();
    this.state.reset();
    this.start();
  }

  connection(port, pipe){

  }

  disconnection(port, pipe){

  }

  /**
   * Send data out of a specific port, which may have a pipe attached to it that will pass it on to some other agents port.
   * data is emitted into a pipe that has subscribed on the appropriate port.
   */
  send(port, data, options){
    const eventName = `send:${port}`;

    //NOTE: THIS SIMULATES NODE PROCESSING
  if(this.debug1){
    setTimeout(()=>{
      this.emit(eventName, data, options);
      this.emit('tx', port); // Light for received data
    }, this.debug.delay)
  }else{
    this.emit(eventName, data, options);
    if(this.debug) this.emit('tx', port); // Light for received data
  }


  }

  /**
   * This is the function that accepts data from a pipe, it indicates what port that data is meant for, and what agent it is from.
   */
  receive(port, data, address, options){

    // NOTE HERE WE WAIT FOR PIPE TO FINISH ANIMATING
    if(this.debug){
      setTimeout(()=>{
        this.emit('rx', port); // Light for transmitted data
        this.process(port, data, address, options)
      }, this.debug.delay); // simulate delay to allow animations
    }else{
      this.process(port, data, address, options); //NOTE: process is under user's control
      if(this.debug) this.emit('rx', port); // Light for transmitted data
    }
  }
  // receive(port, data, address, options){
  //   this.process(port, data, address, options); //NOTE: process is under user's control
  //   if(this.debug) this.emit('rx', port); // Light for transmitted data
  // }

  // METHOD OVERRIDING · USER CONTROL

  /**
   * Initialize your variables and needs in preparation for starting the Agent.
   */
  initialize(){

  }
  /**
   * Commit resources to the agent and activate it.
   */
  start(){

  }
  /**
   * Free up all the resources
   */
  stop(){

  }
  /**
   * The heart of the agent, put your processing in here.
   */
  process(port, data, address, options){

  }






  // CUSTOM EVENT EMITTER
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
