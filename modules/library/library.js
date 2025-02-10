import Signal from "signal";
import Commander from "commander";
import Scheduler from "scheduler";
import List from "list";

import Dataset from "dataset";
import Settings from "settings";
import State from "state";
import guid from "guid";

import CONFIGURATION from "configuration";

class Source {

  id;
  type;
  parent;
  children;
  content;

  dataset;
  settings;
  state;

  constructor(id, type) {
    this.id = id || guid();
    this.type = type || "node";

    this.children = [];
    this.content = new Signal();

    this.dataset = new Dataset();
    this.settings = new Settings();

    this.state = new State({
      initialize: this.initialize.bind(this),
           start: this.start.bind(this),
           pause: this.pause.bind(this),
            stop: this.stop.bind(this),
          resume: this.resume.bind(this),
         dispose: this.dispose.bind(this),
    });

  }

  // TREE BUILDING //

  create(node) {
    node.parent = this;
    this.children.push(node);
    this.propagate("create", node);
  }

  remove() {
    this.stop();
    this.dispose();
    this.parent.delete(this);
  }

  delete(node) {
    const index = this.children.indexOf(node);
    if (index > -1) {
      this.children.splice(index, 1);
    }
    this.propagate("delete", node);
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

  filter(f) {
    return this.children.filter(f);
  }

  get(...path) {
    if (this.children.length === 0) throw new Error("Location is empty");
    const [currentId, ...remainingPath] = path;
    const node = this.children.find((child) => child.id === currentId);
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
    if (!this.watchers[name][pattern])
      this.watchers[name][pattern] = [];
    this.watchers[name][pattern].push(callback);
    return () => this.unwatch(name, pattern, callback);
  }
  unwatch(name, pattern, callback) {
    const index = this.watchers[name][pattern].indexOf(callback);
    if (index > -1) {
      this.watchers[name][pattern].splice(index, 1);
    }
    if (this.watchers[name][pattern].length == 0)
      delete this.watchers[name][pattern];
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


  // User Methods, will be called by state machine as needed
  // they are exposed here for beauty purposes.
  initialize(){
    console.warn('.initialize() must be overriden');
  }

  start(){
    console.warn('.start() must be overriden');
  }

  pause(){
    console.warn('.pause() must be overriden');
  }

  resume(){
    console.warn('.resume() must be overriden');
  }

  stop(){
    console.warn('.stop() must be overriden');
    console.warn('.stop() must collectGarbage');
    this.collectGarbage(); // user should call collect garbage
  }

  dispose(){
    console.warn('.dispose() must be overriden');
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
        console.log(
          "agent stop automatic garbage collect clearTimeout(timeoutId)",
        );
        clearTimeout(timeoutId);
      },
    });
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
    // shorthand for component level garbage collection
    this.#garbage.push({
      type: "gc",
      id: "gc-" + this.#garbage.length,
      ts: new Date().toISOString(),
      subscription,
    });
  }

}

export class Application extends Source {
  commander;
  activeLocation = new Signal("main");

  constructor(...a) {
    super(...a);
    this.commander = new Commander(this);
  }

  start() {
    console.info('Application Start')
    this.all .filter((o) => o !== this) .map((node) => (node.state.initialize()));
    this.all .filter((o) => o !== this) .map((node) => (node.state.start()));
  }

  stop() {
    this.all .filter((o) => o !== this) .map((node) => (node.state.stop()));
    this.all .filter((o) => o !== this) .map((node) => (node.state.dispose()));
  }
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
}

export class Location extends Source {
  getRelated(id) {
    // return items related to id in a scene, usualy for removal.
    const from = this.children
      .filter((child) => child.type === "pipe")
      .filter((child) => child.dataset.get("from") !== undefined)
      .filter((child) => child.dataset.get("from").value.startsWith(id + ":"));
    const to = this.children
      .filter((child) => child.type === "pipe")
      .filter((child) => child.dataset.get("to") !== undefined)
      .filter((child) => child.dataset.get("to").value.startsWith(id + ":"));
    return [...from, ...to];
  }

  // 'distortion1', 'tone-js/distortion',         {left: 100, top: 100}, {distortion: 0.4}
  createModule(id, modulePath, dataset, settings) {
    const path = ["modules", ...modulePath.split("/")];
    const module = this.root.get(...path);
    const Component = module.content.value;
    // Initialize important objects
    const component = new Component(id);
    component.type = "window";

    // Assign options
    if (!dataset.title) dataset.title = module.settings.name;
    Object.entries(dataset)
      .filter(([key, val]) => val)
      .forEach(([key, val]) => component.dataset.set(key, val));

    component.settings.merge({ ...Component.defaults, ...settings });

    // Add to stage
    this.create(component);
    // do not autostart, you are just creating, not starting - start is a different process, it can be triggered by commands or load scripts
    return component;
  }

  createConnection(fromAddress, toAddress) {
    // Initialize important objects
    const id = [fromAddress, toAddress].join("__").replace(/:/g, "_");
    const connector = new Connector(id);
    // Assign options
    connector.dataset.set("from", fromAddress);
    connector.dataset.set("to", toAddress);
    // Add to stage
    this.create(connector);
    // do not autostart, you are just creating, not starting - start is a different process, it can be triggered by commands or load scripts
    return connector;
  }
}

export class Component extends Source {
  rate = new Signal(1); // speed of emitting signals
  health = new Signal("nominal"); // component health
  channels = new List();

  constructor(id) {
    super(id, "window");
  }

  // UTILITY FUNCTIONS SPECIFIC TO COMPONENT
  pipes(name) {
    return this.parent.filter(
      (o) =>
        o.type === "pipe" &&
        o.dataset.get("from").value === this.id + ":" + name,
    );
  }

  connectable() {
    return true; //TODO: this should be false by default
  }
  connect() {}
  disconnect() {}

  receive(port, data, address, options) {
    this.emit("receive", port, data, address, options); // asap as data is received, (ex. trigger the ball rolling)
    this.execute(port, data, address, options); // NOTE: process is under user's control
  }

  execute(port, data, address, options) {
    console.warn("This method in meant to be overridden");
    this.pipes("out").forEach((pipe) =>
      pipe.send("in", data, this.id + ":out", options),
    );
  }


}

export class DataRequest {
  from = { id: null, port: null };
  to = { id: null, port: null };
  source = null;
  destination = null;
  constructor(context) {
    // TODO: unknown.. cache and make reactive...
    Object.assign(
      this.from,
      Object.fromEntries(
        [context.dataset.get("from").value.split(":")]
          .map(([id, port]) => [
            ["id", id],
            ["port", port],
          ])
          .flat(),
      ),
    );
    Object.assign(
      this.to,
      Object.fromEntries(
        [context.dataset.get("to").value.split(":")]
          .map(([id, port]) => [
            ["id", id],
            ["port", port],
          ])
          .flat(),
      ),
    );
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




export class Connector extends Source {
  #connectionRequest;
  rate = new Signal(1); // speed of transmitting signals
  health = new Signal("nominal"); // component health
  constructor(id) {
    super(id, "pipe");
  }

  /**
   * Pipe receive, when a pipe receives data, it passes it to the destination
   */
  receive(data, options) {
    const transportationRequest = new TransportationRequest( this, data, options, );
    if (CONFIGURATION.simulation.value === true) {
      const scheduler = new Scheduler({
        // schedule the arrival
        rate: this.rate,
        duration: CONFIGURATION.flowDuration,
        paused: CONFIGURATION.paused,
        stop: () => destination.receive(transportationRequest),
      });
      this.gc = scheduler.start();
    } else {
      destination.receive(transportationRequest);
    }
  }

  start() {
    console.warn("Investigate time travel, connectors should naturally come second");
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

  stop() {
    if (this.#connectionRequest) this.#connectionRequest.source.disconnect(this.#connectionRequest);
    this.collectGarbage();
  }
}

export class Modules extends Source {

}

export class Library extends Source {
  register(id, content) {
    const tool = new Source(id);
    tool.content.value = content;
    tool.settings.name = content.caption;
    tool.settings.description = content.description;
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
