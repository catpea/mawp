import Dataset from 'dataset';
import Signal from 'signal';
import List from 'list';
import State from 'state';
import guid from 'guid';

export default class Branch {
  id;
  type;
  parent;
  children = [];
  content = new Signal();
  content = new Signal();
  content = new Signal();

  constructor(id, type) {
    this.id = id||guid();
    this.type = type||'node';
    this.dataset = new Dataset();
    this.settings = new List();
    this.state = new State();

    this.initialize();

  }

  // Second constructor
  initialize() { }

  // TREE BUILDING //

  create(node){
    node.parent = this;
    this.children.push(node);
    this.propagate('create', node);
  }

  remove(){
    this.stop();
    this.dispose();
    this.parent.delete(this);
  }

  stop(){
    this.collectGarbage(); // user should call collect garbage
  }
  dispose(){
    // under user control
  }

  delete(node){
    const index = this.children.indexOf(node);
    if (index > -1) {
      this.children.splice(index, 1);
    }
    this.propagate('delete', node);
  }

  // GETTERS AS TREE UTILITIES //

  get root() {
    let node = this;
    while (node.parent) {
      node = node.parent;
    }
    return node;
  }

  get path() {
    const path = [];
    let node = this;
    while (node) {
      path.unshift(node);
      node = node.parent;
    }
    return path;
  }

  get all() {
    const nodes = [];
    const stack = [this.root]; // Initialize stack with the root node

    while (stack.length > 0) {
      const node = stack.pop();
      nodes.push(node);
      // Add child nodes to the stack (reverse order to maintain left-to-right traversal)
      for (let i = node.children.length - 1; i >= 0; i--) {
        stack.push(node.children[i]);
      }
    }
    return nodes;
  }

  filter(f){
    return this.children.filter(f);
  }

  get(...path) {
    if (this.children.length === 0) throw new Error('Location is empty');
    const [currentId, ...remainingPath] = path;
    const node = this.children.find(child => child.id === currentId);
    if (!node) throw new Error('Failed to locate '+currentId);
    if (remainingPath.length === 0) return node;
    return node.get(...remainingPath);
  }

  // PROPAGATING EMITTER SYSTEM //

  watchers = {};
  match(pattern, event) {
    const parts = pattern.split('*');
    let index = 0;
    for (const part of parts) {
      if (part === '') continue;
      index = event.indexOf(part, index);
      if (index === -1) return false;
      index += part.length;
    }
    return true;
  }
  watch(name, pattern, callback, phase=1) {
    if (!this.watchers[phase]) this.watchers[phase] = {};
    if (!this.watchers[phase][name]) this.watchers[phase][name] = {};
    if (!this.watchers[phase][name][pattern]) this.watchers[phase][name][pattern] = [];
    this.watchers[phase][name][pattern].push(callback);
    return () => this.unwatch(name, pattern, callback, phase);
  }
  unwatch(name, pattern, callback, phase) {
    const index = this.watchers[phase][name][pattern].indexOf(callback);
    if (index > -1) {
      this.watchers[phase][name][pattern].splice(index, 1);
    }
    if (this.watchers[phase][name][pattern].length == 0) delete this.watchers[phase][name][pattern];
  }
  propagate(name, target, ...args) {

    const event = '/' + target.path.map(o => o.id).join('/');
    const taillessPath = target.path.slice(0,-1)
    const phasedStack = [taillessPath, [target, ...taillessPath.toReversed()]];
    let phasesStopped = false;
    for (let phase = 0; phase < phasedStack.length; phase++) {
    if (phasesStopped) break;
    let propagationStopped = false;
      for (const currentTarget of phasedStack[phase]) {
        if (propagationStopped) break;
        if(currentTarget.watchers[phase]){
          if(currentTarget.watchers[phase][name]){
            for (const pattern in currentTarget.watchers[phase][name]) {
              if (this.match(pattern, event)) {
                let immediatePropagationStopped = false;
                for (const callback of currentTarget.watchers[phase][name][pattern]) {
                  if (immediatePropagationStopped) break;
                  const packet = {
                    phase,
                    event,
                    target,
                    currentTarget,
                    stopPropagation: () => { phasesStopped = true; propagationStopped = true },
                    stopImmediatePropagation: () => { phasesStopped = true; propagationStopped = true; immediatePropagationStopped = true; },
                  };
                  callback.bind(currentTarget)(packet);
                } // for [IMMEDIATE] watchers under matching pattern
              } // if event matches
            } // for watchers in current target
          } // if phase even exists
        } // if name even exists
      } // phase array
    } // for phace integer

  } // end propagate


  // PLAIN OLD EMITTER SYSTEM //

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
      console.log('agent stop automatic garbage collect clearTimeout(timeoutId)')
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
