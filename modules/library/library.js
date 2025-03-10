import Signal from 'signal';
import Commander from 'commander';
import Scheduler from 'scheduler';
import List from 'list';

import { memory, Settings } from 'storage/web-ext/index.js';

import State from 'state';
import guid from 'guid';

import CONFIGURATION from 'configuration';
import {allocationTable} from './AllocationTable.js';

// Storage of Source instances


class Children {

  #allocationTable; // reverence to the central place that holds object instances
  #signal; // the children signal of the current node

  constructor(allocationTable, signal){
    if(!allocationTable) throw new Error('Allocation table is required')
    this.#allocationTable = allocationTable;
    this.#signal = signal;
  }

  subscribe(f){
    return this.#signal.subscribe(f);
  }

  append(id){
    console.log('ID', id)
    if(typeof id !== 'string') throw new TypeError('You must specify a string id');
    // NOTE: we are performing an asignment to the signal
    // NOTE: we must not prefix by space an empty value
    this.#signal.value = this.#signal.value?this.#signal.value + ' ' + id:id;
  }

  remove(id){
    if(typeof id !== 'string') throw new TypeError('You must specify a string id');
    // NOTE: we are performing an asignment to the signal
    this.#signal.value = this.keys().filter(o=>o!==id).join(' ');
    // NOTE: less robust but faster method:
    // it expects well formed strings, with one space as separator.
    // this.#signal.value = (this.#signal.value + ' ').replaceAll(id + ' ', '').trimEnd();
  }

  keys(){
    console.log('KEYS', this.#signal.value, this.#signal.value.split(/\s+/))
    return this.#signal.value.split(/\s+/);
  }

  values(){
    return this.keys().map(id => this.#allocationTable.get(id));
  }

  [Symbol.iterator]() {
    return this.values()[Symbol.iterator]()
  }

  get length(){ return this.keys().length }


  has(id){
    if(typeof id !== 'string') throw new TypeError('You must specify a string id');
    return this.keys().includes(id);
  }

  get(id){
    if(!this.has(id)) throw new TypeError(`Not Found: ${id}`);
    if(this.#allocationTable.keys().length == 0) throw new Error(`Allocation Table Is Empty (attempting to load "${id}")`);
    console.log('HAS', id, this.has(id), this.keys().includes(id), this.keys(), this.#allocationTable.keys())
    return this.#allocationTable.get(id);
  }

  filter(...a){ return this.values().filter(...a) }

  // map(...a){ return this.#signal.value.split(/\s+/).map(...a) }
  // reduce(...a){ return this.#signal.value.split(/\s+/).reduce(...a) }

  // sort(...a){ return this.#signal.value.split(/\s+/).sort(...a) }
  // find(...a){ return this.#signal.value.split(/\s+/).find(...a) }


}

export class DataRequest {
  pipe = {id:null}
  from = { id: null, port: null };
  to = { id: null, port: null };
  source = null;
  destination = null;
  constructor(context) {
    this.pipe.id = context.id;

    if( (!context.settings.get('from', 'value'))||(!context.settings.get('to', 'value')) ) throw new Error(`Data request from ${context.id} is invalid as from||to is empty`);

    // TODO: unknown.. cache and make reactive...
    Object.assign( this.from, Object.fromEntries( [context.settings.get('from', 'value').split(":")] .map(([id, port]) => [ ["id", id], ["port", port], ]) .flat(), ), );
    Object.assign( this.to, Object.fromEntries( [context.settings.get('to', 'value').split(":")] .map(([id, port]) => [ ["id", id], ["port", port], ]) .flat(), ), );

    this.source = context.parent.get(this.from.id);
    this.destination = context.parent.get(this.to.id);
  }
}

export class ConnectionRequest extends DataRequest {

}

export class TransportationRequest extends DataRequest {

  data = null;
  options = null;
  constructor(context, data, options) {
    super(context);
    this.data = data;
    this.options = options;
  }

}


class Source {

  id; // this is where id is kept, it is not changable
  type; // evey node has a type
  parent; // we keep track of parents

  children; // the tree nature
  content; // It is a signal used by some components to store instances of objects, think text in a text file

  state; // State Machine
  settings; // where all settings are stored

  constructor(id, type) {
    this.allocationTable = allocationTable;
    this.id = id || guid(); // guid is the prefered method, hard coded id is for conventional components, like applicaion, scenes, modules

    // TODO: freeze what needs to be forzen:
    // this.final('id', id||guid());

    this.type = type || "node";

    this.content = new Signal();


    this.settings = new Settings(this.id, memory);
    this.children = new Children(this.allocationTable, this.settings.signal('children', 'value'));



    this.state = new State(this, {
      initialize: this.initialize.bind(this),
           start: this.start.bind(this),
           pause: this.pause.bind(this),
            stop: this.stop.bind(this),
          resume: this.resume.bind(this),
         dispose: this.dispose.bind(this),
    });



  }







  final(name, value){ Object.defineProperty(this, name, { value, writable: false, configurable: false, enumerable: true }); }

  // TREE BUILDING //
  create(node) {
    node.parent = this;
    console.log('CREATE', node.id)
    this.root.allocationTable.set(node.id, node); // register cached instance in allocation table;
    this.children.append(node.id); // WARN: add node it to the allocation table first!
    this.propagate("create", node);
  }

  remove() {
    this.parent.children.remove(this.id);
    this.root.allocationTable.delete(this.id); // remove cached instance from allocation table;
    this.state.stop();
    this.state.dispose();
    this.propagate("delete", this);

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
    return this.root.allocationTable.all;
  }



  // filter(f) {
  //   return this.children.filter(f);
  // }

  get(...path) {
    if(this.root.id !== 'root') throw new Error(`Attach ${this.root.id} to the tree first.`)
    if(this.root.allocationTable.keys().length == 0) throw new Error(`Allocation Table Is Empty (attempting to get "${id}")`);
    if (this.children.length === 0) throw new Error("Location is empty");

    const [currentId, ...remainingPath] = path;

    // const node = this.children.find((child) => child.id === currentId);
    console.log('GET PATH ZZZ', path, this.root.allocationTable.keys())
    console.log('GET PATH ZZZ ID', this.id, this.root.id, this.root.allocationTable.keys())
    console.log('GET PATH ZZZ currentId', currentId, this.children.has(currentId))

    const node = this.children.get(currentId);

    if (!node) throw new Error("Failed to locate " + currentId);
    if (remainingPath.length === 0) return node;
    return node.get(...remainingPath);
  }

  // PROPAGATING EMITTER SYSTEM //

  watchers = {};
  match(pattern, event) {
    const parts = pattern.split("*");
    let index = 0;
    for (const part of parts) {
      if (part === "") continue;
      index = event.indexOf(part, index);
      if (index === -1) return false;
      index += part.length;
    }
    return true;
  }
  watch(name, pattern, callback) {
    if (!this.watchers) this.watchers = {};
    if (!this.watchers[name]) this.watchers[name] = {};
    if (!this.watchers[name][pattern]) this.watchers[name][pattern] = [];
    this.watchers[name][pattern].push(callback);

    return () => this.unwatch(name, pattern, callback);
  }
  unwatch(name, pattern, callback) {
    const index = this.watchers[name][pattern].indexOf(callback);
    if (index > -1) this.watchers[name][pattern].splice(index, 1);
    if (this.watchers[name][pattern].length == 0) delete this.watchers[name][pattern];
    console.log(`UNWATCH: removed watcher index ${index}`)
  }

  /**
   * Propagates events through a hierarchical path system similar to Derby.js path monitoring.
   * Events bubble up from the target node to the root, allowing listeners to intercept them at any level.
   *
   * Path-based event monitoring allows components to watch for changes at specific paths in the tree.
   * For example: '/root/projects/123/*' would match any events under project 123.
   *
   * Example usage:
   *   source.watch('create', 'projects/123/*', ({target}) => handleCreate(target));
   *   source.watch('delete', 'projects/123', ({target}) => handleDelete(target));
   *
   * @param {string} name - The event name (e.g., 'create', 'delete', 'update')
   * @param {Object} target - The node where the event originated
   * @param {...any} args - Additional arguments to pass to event handlers
   */
  propagate(name, target, ...args) {
    // Construct the event path string starting from root (e.g., "/root/projects/123/task")
    // This path can be matched against watchers' patterns for filtering events
    const event = "/" + target.path.map(o => o.id).join("/");

    // Create the bubbling path array starting from the target and moving up to parent nodes
    // Example: for path /root/projects/123/task, the array would be:
    // [taskNode, 123Node, projectsNode, rootNode]
    const path = [target, ...target.path.slice(0, -1).toReversed()];

    // Controls whether the event should continue bubbling up
    let propagationStopped = false;

    // Bubble the event up through each node in the path
    for (const currentTarget of path) {
      if (propagationStopped) break;

      // Check if the current node has watchers for this event type
      if (currentTarget.watchers?.[name]) {
        // Check each pattern registered for this event type
        // Patterns can include wildcards like 'projects/*' or 'projects/*/tasks'
        for (const pattern in currentTarget.watchers[name]) {
          if (this.match(pattern, event)) {
            // Controls whether more handlers at the current pattern should be executed
            let immediatePropagationStopped = false;

            // Execute all callbacks registered for this pattern
            for (const callback of currentTarget.watchers[name][pattern]) {
              if (immediatePropagationStopped) break;

              // Create the event packet with control methods
              const packet = {
                event,      // The full path string of the event
                target,     // The original node where the event occurred
                currentTarget, // The current node in the bubbling phase
                // Stop the event from bubbling to parent nodes
                stopPropagation: () => {
                  propagationStopped = true;
                },
                // Stop both bubbling and other handlers at current level
                stopImmediatePropagation: () => {
                  propagationStopped = true;
                  immediatePropagationStopped = true;
                }
              };

              // Execute the callback with the current node as 'this' context
              callback.bind(currentTarget)(packet);
            }
          }
        }
      }
    }
  }




  // PLAIN OLD EMITTER SYSTEM //

  subscribers = {};
  // Event handling methods
  on(event, callback) {
    // Register a callback for an event
    if (!this.subscribers[event]) {
      this.subscribers[event] = [];
    }
    this.subscribers[event].push(callback);
    return () => this.off(event, callback);
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
    this.subscribers[event] = this.subscribers[event].filter(
      (cb) => cb !== callback,
    );
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

  // UTILITY FUNCTIONS

  listenTo(thing, event, listener){
    if (!thing || !event || !listener) { throw new Error('All arguments (thing, event, listener) must be provided'); }
    const boundListener = listener.bind(this);
    thing.addEventListener(event, boundListener);
    return ()=>thing.removeEventListener(event, boundListener);
  }

  // GARBAGE COLLECTED TIMEOUT
  setTimeout(timeoutFunction, timeoutDuration, type = "timeout") {

    const timeoutGuid = guid();
    const timeoutId = setTimeout(() => {
      this.#garbage.splice(
        this.#garbage.findIndex((o) => o.id === timeoutGuid),
        1,
      );
      timeoutFunction();
    }, timeoutDuration);

    this.#garbage.push({
      type,
      id: timeoutGuid,
      ts: new Date().toISOString(),
      subscription: () => {
        clearTimeout(timeoutId);
      },
    });

    return ()=>clearTimeout(timeoutId);
  }
  clearTimeouts(type) {
    const matches = this.#garbage
      .filter((o) => o.type === type)
      .map((s) => s.subscription());
    this.#garbage = this.#garbage.filter((o) => o.type !== type);
  }

  // GARBAGE COLLECTION

  #garbage = [];
  collectGarbage() {
    this.#garbage.map((s) => s.subscription());
  }
  set gc(subscription) {

    if (typeof subscription !== 'function') {
      throw new Error('gc subscription must be a function');
    }

    // shorthand for component level garbage collection
    this.#garbage.push({
      type: "gc",
      id: "gc-" + this.#garbage.length,
      ts: new Date().toISOString(),
      subscription,
    });
  }

}


/**
  This is the root.
*/
export class Application extends Source {


  commander;
  activeLocation = new Signal("main");


  constructor(...a) {
    super(...a);
    this.commander = new Commander(this);
  }

  start() {
    //console.info('Application Start')
    this.all .filter((o) => o !== this) .map((node) => (node.state.initialize()));
    this.all .filter((o) => o !== this) .map((node) => (node.state.start()));
  }

  stop() {
    this.all .filter((o) => o !== this) .map((node) => (node.state.stop()));
    this.all .filter((o) => o !== this) .map((node) => (node.state.dispose()));
    this.collectGarbage();
  }

  initialize() {}
  pause() {}
  resume() {}
  dispose() {}

}

export class Project extends Source {
  // LIFECYCLE SYSTEM

  async load(url) {
    ///console.log('TODO...');
  }
  async save(url) {
    ///console.log('TODO...');
  }

  // #commandModules = new Map();
  // async getAgent(scopedName = '@core/standard-agent'){
  //   const [scope, name] = scopedName.split('/');
  //   if (this.#commandModules.has(name)) return this.#commandModules.get(name);
  //   const agentPath = `./agents/${scope}/${name}/index.js`;
  //   const AgentModule = await import(agentPath);
  //   this.#commandModules.set(name, AgentModule.default);
  //   return AgentModule.default;
  // }
  //
  initialize() {}
  start() {}
  pause() {}
  resume() {}
  dispose() {}
  stop() {
      this.collectGarbage();
  }
}

export class Location extends Source {

  initialize() {}
  start() {}
  pause() {}
  resume() {}
  stop() {
      this.collectGarbage();
  }
  dispose() {}

  getRelated(id) {
    // return items related to id in a scene, usualy for removal.
    const from = this.children .filter((child) => child.type === "pipe") .filter((child) => child.settings.get('from', 'value') !== undefined) .filter((child) => child.settings.get('from', 'value').startsWith(id + ":"));
    const to = this.children .filter((child) => child.type === "pipe") .filter((child) => child.settings.get('to', 'value') !== undefined) .filter((child) => child.settings.get('to', 'value').startsWith(id + ":"));
    return [...from, ...to];
  }

  // 'distortion1', 'tone-js/distortion',         {left: 100, top: 100}, {distortion: 0.4}


  createModule(id, modulePath, settings) {
    if(this.root.id !== 'root') throw new Error(`Attach ${this.root.id} to the tree first.`)
    console.info('createModule', id, modulePath)
    const path = ["modules", ...modulePath.split("/")];
    console.log('PATH', ...path)

    const module = this.root.get(...path);
    console.log(this.root.get('modules').children.keys())

    const Component = module.content.value;
    // Initialize important objects
    const component = new Component(id);
    component.type = "window";

    const setup = { ...Component.defaults, ...settings,  };

    for (const [key, value] of Object.entries(setup).filter(([key, value])=>value===Object(value))) {
      if(!('kind' in value)) throw new Error('Setting rows must specify a kind.');
    }

    component.settings.assignValues(setup);

    // Add to stage
    this.create(component);
    // do not autostart, you are just creating, not starting - start is a different process, it can be triggered by commands or load scripts
    // this.root.allocationTable.set(component.id, component); // register self in allocation table;

    return component;
  }

  createConnection(fromAddress, toAddress) {
    // Initialize important objects
    const id = [fromAddress, toAddress].join("__").replace(/:/g, "_");
    const connector = new Connector(id);
    // Assign options
    connector.settings.set('from', 'value', fromAddress );
    connector.settings.set('to', 'value', toAddress );

      if( !connector.settings.get('from', 'value') ) console.error(`STORAGE ENGINE FAILURE: From may not be empty (${connector.id})`, `GOT: "${connector.settings.get('from', 'value')}", MUST BE: "${fromAddress}"`);
      if( !connector.settings.get('to', 'value') ) console.error(`STORAGE ENGINE FAILURE: To may not be empty (${connector.id})`, `GOT: "${connector.settings.get('to', 'value')}", MUST BE: "${toAddress}"`);

    // Add to stage
    this.create(connector);
    // do not autostart, you are just creating, not starting - start is a different process, it can be triggered by commands or load scripts
    // this.root.allocationTable.set(connector.id, connector); // register self in allocation table;

    return connector;
  }
}

export class Stage extends Location {

  constructor(...a){
    super(...a);

    this.children.subscribe((newValue, oldValue)=>{
      const isInitialization = !oldValue;
      if(isInitialization) return;

      const local = new Set(oldValue.split(/\s+/));
      const remote = new Set(newValue.split(/\s+/));
      const removed = local.difference(remote);
      const created = remote.difference(local);
      // console.log(`Children changed in ${this.id}: [${[...local]}] -> [${[...remote]}]`);
      console.log('TODO: Children changed removed', ...removed)
      console.log('TODO: Children changed created', ...created)

      for (const removedChildId of removed){
        // this.propagate("create",  this.children.get(removedChildId));
      }

      for (const createdChildId of created){
        // this.propagate("delete",  this.children.get(createdChildId));
      }



    })
  }

}

export class AwaitingComponent extends Source {

  awaiting = new Signal(true); // awaiting pipes
  receivedPipes = new Set()
  values = {};

  postinit() {
    this.gc = this.parent.watch('delete', `*`, ({target:{id}})=> this.receivedPipes.delete(id));
    this.gc = this.parent.watch('create', `*`, ()=>this.determination());
    this.gc = this.parent.watch('delete', `*`, ()=> this.determination());
    this.gc = () => console.log('WATCHERS CLEANUP!!!!');
  }

  determination(){
    const currentPipes = new Set(this.inputPipes().map(o=>o.id));
    const wetPipes = currentPipes.intersection(this.receivedPipes); // takes a set and returns a new set containing elements in this set but not in the given set.
    const dryPipes = currentPipes.difference(this.receivedPipes); // takes a set and returns a new set containing elements in this set but not in the given set.
    if(dryPipes.size === 0) this.awaiting.value = false;
    if(dryPipes.size > 0) this.awaiting.value = true;
    for (const pipeId of wetPipes) this.parent.get(pipeId).dry.value = false; // Mark pipe wet
    for (const pipeId of dryPipes) this.parent.get(pipeId).dry.value = true; // Mark pipe dry
    return !this.awaiting.value;
  }

  receive(dataRequest /* :DataRequest */) {
    const {source, pipe, to:{port}, data, options} = dataRequest;
    this.receivedPipes.add(pipe.id);
    this.values[pipe.id] = data; // capture latest frame of data

    const execute = this.determination();
    if(execute) this.execute(dataRequest);

  }

}

export class Component extends AwaitingComponent {

  rate = new Signal(1); // speed of emitting signals
  health = new Signal("nominal"); // component health
  channels = new List();

  constructor(id) {
    super(id, "window");

    this.settings.initializeDefaults({
      title: 'Untitled',
      active: true, // TODO: convert active to Boolean
      note: '',
      style: null,
      zindex: 0,
      left: 0,
      top: 0,
      width: null,
      height: null,
    });

    // NOTE: this is where we convent static ports to channels, a port is an idea, a channel is the real thing
    if(this.constructor.ports){
      for( const [name, value] of Object.entries(this.constructor.ports)){
        this.channels.set(name, value);
      }
    }
  }

  // UTILITY FUNCTIONS SPECIFIC TO COMPONENT

  inputPipes() {
    return this.parent.children.filter( (o) => o.type === "pipe" && o.settings.get('to', 'value').startsWith(this.id + ':')) ;
  }
  inputPipe(name) {
    return this.inputPipes().find(o=>o.settings.get('to', 'value').endsWith(':'+name));
  }
  outputPipe(name) {
    return this.parent.children.filter( (o) => o.type === "pipe" && o.settings.get('from', 'value').startsWith(this.id + ':')).find(o=>o.settings.get('from', 'value').endsWith(':'+name));
  }

  connectable(request){
    return true;
  }
  connect(){
  }
  disconnect(){
  }

  // Settings Helpers
  // getSignalList => getSettingsOfKind('field', {includeReadonly: false})
  getSettingsOfKind(kind, options={}){
    const defaults = { includeReadonly: true, decodeSignals:true };
    const {includeReadonly, decodeSignals} = Object.assign({}, defaults, options);

    const list =
      Object.entries(this.constructor.defaults)
      .filter(([key, value])=>value===Object(value))
      .filter(([key,value])=>value.kind===kind)
      .filter(([key,value])=>includeReadonly?!value.readonly:false) //

      .map(([key, value]) => [key,
        Object.fromEntries( Object.keys(value).map(subKey=> [subKey, this.settings[decodeSignals?'get':'signal'](key, subKey)] ) )
      ])

      // .map(([key]) => [key, this.settings[decodeSignals?'get':'signal'](key, 'value')])

    return list;
  }



  // getSignalList(){
  //   const signals = Object
  //     .entries(this.constructor.defaults)
  //     .filter(([key, value])=>value===Object(value))
  //     .filter(([key,value])=>value.kind==='field')
  //     .filter(([key,value])=>!value.readonly) //
  //     .map(([key]) => [key, this.settings.signal(key, 'value')]);
  //   return signals;
  // }

}


export class Connector extends Source {
  #connectionRequest;

  dry = new Signal(true); // all pipes are dty by default, this is just a visual indicator
  rate = new Signal(1); // speed of transmitting signals
  health = new Signal("nominal"); // component health

  constructor(id) {
    super(id, "pipe");
    this.settings.set('active', 'value', false);
  }

  initialize() {}

  /**
   * Pipe receive, when a pipe receives data, it passes it to the destination
   */
  receive(data, options) {

    const transportationRequest = new TransportationRequest( this, data, options, );

    let onTheSameScene = true;
    const currentScene = this.root.activeLocation.value;
    const sourceScene = this.#connectionRequest.source.parent.id;
    const destinationScene = this.#connectionRequest.destination.parent.id;
    if( (sourceScene !== currentScene) || (destinationScene !== currentScene) ) onTheSameScene = false;
    // if(   (destinationScene !== currentScene) ) onTheSameScene = false;

    // console.log( {onTheSameScene})
    //console.log( {onTheSameScene, currentScene, sourceScene, destinationScene} )

    this.#connectionRequest.source.emit('send-marble', transportationRequest.from.port);

    if ( CONFIGURATION.simulation.value === true) {
      const duration = onTheSameScene?CONFIGURATION.flowDuration:0;

      // ovveride duration of speed of marbles in an external non selected scene
      this.emit('activate-marble', {duration}); // as soon as possible emit activate marble, this is something the UI on top will be listening for
      //console.log('activate-marble')

      const scheduler = new Scheduler({
        // schedule the arrival
        rate: this.rate,
        duration: duration,
        paused: CONFIGURATION.paused,
        complete: () => {
          this.#connectionRequest.destination.emit('receive-marble', transportationRequest.to.port); // WHEN MARBLE ANIMATION STOPS
          this.#connectionRequest.destination.receive(transportationRequest)
        },

      });

      this.gc = scheduler.start();

    } else {
      this.#connectionRequest.destination.receive(transportationRequest);
    }
  }

  start() {

    if(!this.settings.get('from', 'value')) throw new TypeError('Missing settings:from value');

    console.warn("Investigate time travel, initialize connection only after all windows initialized (microtask?)");
    setTimeout(() => {
      const request = new ConnectionRequest(this);
      const isConnectable = request.source.connectable(request);

      if (isConnectable) {
        //NOTE: if request is denied, it is not stored so that stop is not called.
        request.source.connect(request);
        this.#connectionRequest = request;
      } else {
        console.warn("NOT CONNECTABLE!");
        this.remove();
      }
    }, 1);
  }

  pause() {}
  resume() {}

  stop() {
    if (this.#connectionRequest) this.#connectionRequest.source.disconnect(this.#connectionRequest);
    this.collectGarbage();
  }

  dispose() {}

}

export class Modules extends Source {
  initialize() {}
  start() {}
  pause() {}
  resume() {}
  stop() {
    this.collectGarbage();
  }
  dispose() {}
}

export class Tool extends Source {
  initialize() {}
  start() {}
  pause() {}
  resume() {}
  stop() {
    this.collectGarbage();
  }
  dispose() {}
}

export class Library extends Source {
  initialize() {}
  start() {}
  pause() {}
  resume() {}
  stop() {
    this.collectGarbage();
  }
  dispose() {}
  register(id, content) {
    const tool = new Tool(id);
    tool.content.value = content;
    // tool.settings.set('caption',     'value', content.constructor.caption);
    // tool.settings.set('description', 'value', content.constructor.description);
    this.create(tool);
  }
}

export default {
  Application,
  Project,
  Location,
  Component,
  Connector,
  Modules,
  Library,
};
