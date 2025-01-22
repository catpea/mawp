import Signal from 'signal';
import Branch from 'branch';
import Commander from 'commander';
import Agent from 'agent';
import CONFIGURATION from 'configuration';

class Project extends Branch {
  Scene = Location;
  Component = Component;
  Connector = Connector;
  BasicAgent = StandardAgent;

  commander;
  activeLocation = new Signal('main');

  constructor(...a) {
    super(...a)
    this.commander = new Commander(this);
  }

  // LIFECYCLE SYSTEM

  async load(url){
    ///console.log('TODO...');
  }
  async save(url){
    ///console.log('TODO...');
  }

  async startup(){
    // await Promise.all( this.all.filter(o=>o.onStart).map(o=>o.onStart()) )
    // this.all.map(node=>node.emit('start'));
    this.all.map(node=>node.start?node.start():null);
  }

  async shutdown(){
    // await Promise.all(this.all.filter(o=>o.onStop).map(o=>o.onStop()))
    // this.all.map(node => node.emit('stop'));
    this.all.map(node=>node.stop?node.stop():null);
  }

  #commandModules = new Map();
  async getAgent(scopedName = '@core/standard-agent'){
    const [scope, name] = scopedName.split('/');
    if (this.#commandModules.has(name)) return this.#commandModules.get(name);
    const agentPath = `./agents/${scope}/${name}/index.js`;
    const AgentModule = await import(agentPath);
    this.#commandModules.set(name, AgentModule.default);
    return AgentModule.default;
  }


}

class Location extends Branch {

  getRelated(id) { // return items related to id in a scene, usualy for removal.
    const from = this.children.filter(child=>child.type==='pipe').filter(child=>child.dataset.get('from')!==undefined).filter(child=>child.dataset.get('from').value.startsWith(id+':'));
    const to = this.children.filter(child=>child.type==='pipe').filter(child=>child.dataset.get('to')!==undefined).filter(child=>child.dataset.get('to').value.startsWith(id+':'));
    return [...from, ...to];
  }

  createComponent(id, options, agent = new StandardAgent()){

    // Initialize important objects
    const component = new Component(id);
    component.agent = agent;
    agent.id = 'agent-'+id;
    // Assign options
    Object.entries(options).filter(([key,val])=>val).forEach(([key,val])=>component.dataset.set(key,val))

    // Add to stage
    this.create(component);
    return component;
  }

  createConnection(fromAddress, toAddress){
    // Initialize important objects
    const id = [fromAddress,toAddress].join('__').replace(/:/g,'_');
    const connector = new Connector(id);

    // Assign options
    connector.dataset.set('from', fromAddress);
    connector.dataset.set('to', toAddress);

    // Add to stage
    this.create(connector);
    return connector;
  }



}






class StandardAgent extends Agent {
  process(port, message, sender, setup){
    this.send('out', message, {});
  }
}

class DataMerge extends Agent {
  process(port, message, sender, setup){
    this.send('out', message, {});
  }
}

class ReactiveVariable extends Agent {
  #previousValue = undefined;
  process(port, message, sender, setup){
    //console.warn('ReactiveVariable RECEIVE', this.id, ...[...arguments])
    const newValue = message;

    if( newValue === undefined || newValue === null ) return; // NOTE: core feature: not interested in empty
    if(this.deepEqual(newValue, this.#previousValue)) return; // NOTE: core feature: silent on unchanged

    this.send('out', newValue, {});

    this.#previousValue = newValue;
  }

  // --- PERSONAL HELPER FUNCIONS --- //

  deepEqual(a, b, visited = new Set()) {
    // Check for strict equality first
    if (a === b) {
      return true;
    }

    // If either value is primitive, they are not equal (since !==)
    if (this.isPrimitive(a) || this.isPrimitive(b)) {
      return false;
    }

    // Handle cyclic references
    if (visited.has(a)) {
      return true; // Assume cyclic structures are equal
    }
    visited.add(a);

    // Ensure both are of the same type
    if (Object.prototype.toString.call(a) !== Object.prototype.toString.call(b)) {
      return false;
    }

    // Compare arrays
    if (Array.isArray(a)) {
      if (a.length !== b.length) {
        return false;
      }

      for (let i = 0; i < a.length; i++) {
        if (!this.deepEqual(a[i], b[i], visited)) {
          return false;
        }
      }

      return true;
    }

    // Compare objects
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    // Check for different number of keys
    if (keysA.length !== keysB.length) {
      return false;
    }

    // Check if all keys and values are equal
    for (let key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) {
        return false;
      }
      if (!this.deepEqual(a[key], b[key], visited)) {
        return false;
      }
    }

    return true;
  }
  isPrimitive(value) {
    return value === null || (typeof value !== 'object' && typeof value !== 'function');
  }
}

class DataBeacon extends Agent {

  initialize(options) {

    this.settings.types('interval:Number delay:Number');
    this.settings.group('user', 'interval delay');

    this.settings.interval = 2_000;
    this.settings.delay = 1_000;

    Object.entries(options).forEach(([key,val])=>this.settings.set(key,val))

  }

  start(){
    this.pulseCounter = 0;
    this.intervalId = setInterval( this.generateData.bind(this), this.settings.interval);
    this.generateData();
  }

  stop(){
    clearInterval(this.intervalId);
  }

  process(port, message, sender, setup){
    if(message.value){
      // this.health.value = 'none';
    }else{
      // this.health.value = 'info'
    }

    const data = message;
    console.log('SEND!!!!!!!!!!!!!!', data);

    this.send('out', data, {});
  }

  // --- PERSONAL HELPER FUNCIONS --- //

  generateData(){
      this.pulseCounter++;
      const pulse = {counter: this.pulseCounter, value: this.pulseCounter % 2 == 0, color: `hsla(${Math.random() * 360}, 80%, 50%, 1)`};
      this.process('in', pulse, null, {}); // NOTE: you must use process directly as receive receives UI hooks, a made up port needs to use process directly.
    }
}




class Component extends Branch {

  constructor(id) {
    super(id, 'window')
    this.dataset.set('port-in', true);
    this.dataset.set('port-out', true);
  }
  start(){
    this.agent.start();
  }

  stop(){
    console.info(this.id + ' agent stop!',)
    this.agent.stop();
    this.collectGarbage()
  }
}

class Connector extends Branch {

  constructor(id) {
    super(id, 'pipe');
    this.agent = new Agent();
  }

  start(){

    const address = this.dataset.get('from').value.split(':');
    const [fromId, port] = address;
    const [toId, toPort] = this.dataset.get('to').value.split(':');
    const source      = this.parent.get(fromId);
    const destination = this.parent.get(toId);

    if(!source.agent) throw new Error('Agent is always required');
    if(!destination.agent) throw new Error('Agent is always required');
    if(!this.agent) throw new Error('Agent is always required');

    if(CONFIGURATION.simulation.value === true){
      this.gc = source.agent.on(`send:${port}`, (data, options)=>{
        this.agent.receive(toPort, data, address, options); // start the ball
        this.setTimeout(()=>{
          destination.agent.receive(toPort, data, address, options); // flash the port on arrival
        }, CONFIGURATION.duration.value * CONFIGURATION.rate.value, 'simulation'); // simulate delay to allow animations
      });
    }else{
      this.gc = source.agent.on(`send:${port}`, (data, options)=>[destination.agent, this.agent].forEach(agent=>agent.receive(toPort, data, address, options)));
    }

    //TODO: a more realistic simulation would be a good idea, but that requires queues... and is that justified?
    // this.gc = ()=>destination.agent.endSimulation(); // pipe has been destroyed, and any simulated events must be destroyed as well.
    // this.gc = ()=>this.agent.endSimulation(); // pipe has been destroyed, and any simulated events must be destroyed as well.







  }

  stop(){
    console.info(this.id + ' agent stop!',)
    this.agent.stop()
    this.collectGarbage()
  }
}

const project = new Project('project');
import UI from './src/UI.js';
const ui = new UI(project);

const mainLocation = new Location('main');
const upperLocation = new Location('upper');
const teeLocation = new Location('tee');

project.create(mainLocation);
project.create(upperLocation);
project.create(teeLocation);

{

  mainLocation.createComponent('beacon1', {title: 'Beacon Transmitter Agent', left: 100, top: 100, 'port-in': false, }, new DataBeacon({interval: 4333}) );
  mainLocation.createComponent('beacon2', {title: 'Beacon Transmitter Agent', left: 100, top: 400, 'port-in': false, }, new DataBeacon({interval: 1000}) );


  mainLocation.createComponent('merge1', {title: 'Data Merge', left: 500, top: 333 }, new DataMerge());
  mainLocation.createConnection('beacon1:out', 'merge1:in');
  mainLocation.createConnection('beacon2:out', 'merge1:in');

  mainLocation.createComponent('dataSignal1', {title: 'Data Signal', left: 800, top: 333 }, new ReactiveVariable());
  mainLocation.createConnection('merge1:out', 'dataSignal1:in');

  mainLocation.createComponent('dataSignal2', {title: 'Beacon Transmitter Agent', left: 100, top: 777, 'port-in': false, });
  mainLocation.createComponent('dataLog1', {title: 'Debug Display', left: 800, top: 777, 'port-out': false, });
  mainLocation.createConnection('dataSignal2:out', 'dataLog1:in');

}

project.load();
project.startup();
ui.start(); // WARN: must come after the tree has fully loaded, otherwise the watcher will begin adding nodes, that are yet to be loaded.
console.log(`Startup at ${new Date().toISOString()}`);

// window.addEventListener('beforeunload', function(event) {
//   //console.log('beforeunload was triggered!')
//   // ui.stop();
//   // project.shutdown();
// });
