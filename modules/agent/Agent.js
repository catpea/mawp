import CONFIGURATION from 'configuration';

import Signal from 'signal';
import Setings from 'settings';
import State from 'state';
import Scheduler from 'scheduler';

import guid from 'guid';

export default class Agent {
  forceRealtime = false;

  id = 'agent'+guid();

  // debug is a plain object to avoid unnecessary lookups
  debug = null; // {delay:1_234}

  rate = new Signal(1); // speed of execution under simulation; 1=normal
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


  if( this.forceRealtime == false && CONFIGURATION.simulation.value === true){

      const sendDelayScheduler = new Scheduler({ // schedule the arrival
        stop: ()=>{
          this.emit(eventName, data, options);
          this.emit('send', port, data, options);
        },
        rate: this.rate,
        duration: CONFIGURATION.computationDuration,
        paused: CONFIGURATION.paused,
      });
      this.gc = sendDelayScheduler.start();

  }else{
      this.emit(eventName, data, options);
      this.emit('send', port, data, options);
  }


  }

  /**
   * This is the function that accepts data from a pipe, it indicates what port that data is meant for, and what agent it is from.
   */
  receive(port, data, address, options){
    this.emit('receive', port, data, address, options) // asap as data is received, (ex. trigger the ball rolling)
    this.process(port, data, address, options); // NOTE: process is under user's control
  }


  // receive(port, data, address, options){
  //   this.emit('receive', port, data, address, options) // asap as data is received, (ex. trigger the ball rolling)

  //   if(CONFIGURATION.simulation.value === true){
  //     this.receiveSimulated(port, data, address, options);
  //   }else{
  //     this.receiveReal(port, data, address, options);
  //   }
  // }

  // endSimulation(){
  //   this.clearTimeouts('simulation');
  // }
  // receiveSimulated(port, data, address, options){
  //   // NOTE: this funcion is not used during normal operation.
  //   // NOTE: HERE WE WAIT FOR PIPE TO FINISH ANIMATING - reception of data arrives for marbles
  //   this.setTimeout(()=>{
  //     this.emit('process', port, data, address, options); // To alert others
  //     this.process(port, data, address, options); // NOTE: process is under user's control
  //   }, CONFIGURATION.duration.value * CONFIGURATION.rate.value, 'simulation'); // simulate delay to allow animations
  // }

  // receiveRealtime(port, data, address, options){
  //   this.emit('process', port, data, address, options); // To alert others
  //   this.process(port, data, address, options); // NOTE: process is under user's control
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
    this.collectGarbage();
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

  // GARBAGE COLLECTED TIMEOUT
   setTimeout(timeoutFunction, timeoutDuration, type='timeout'){
    const timeoutGuid = guid();
    const timeoutId = setTimeout(()=>{
    this.#garbage.splice(this.#garbage.findIndex(o=>o.id===timeoutGuid), 1);
    timeoutFunction();
    }, timeoutDuration);
    this.#garbage.push( {type, id:timeoutGuid, ts:(new Date()).toISOString(), subscription: ()=>{
      // console.log('agent stop automatic garbage collect clearTimeout(timeoutId)')
      clearTimeout(timeoutId);
    }} );
  }
  clearTimeouts(type){
    const matches = this.#garbage.filter(o=>o.type===type).map(s=>s.subscription());
    this.#garbage = this.#garbage.filter(o=>o.type!==type);
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
