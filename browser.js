import Signal from 'signal';
import Branch from 'branch';
import Commander from 'commander';
import Agent from 'agent';
import Scheduler from 'scheduler';

import CONFIGURATION from 'configuration';

class Application extends Branch {

}

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
    this.agent.stop();
    this.collectGarbage()
  }

  connectable(source){
  }
  connect(source){
  }
  receive(request){
  }
  disconnect(){
  }
}


class Connector extends Branch {

  constructor(id) {
    super(id, 'pipe');
    this.agent = new ConnectorAgent();
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
        this.agent.receive(toPort, data, address, options); // start the ball (uses rate sensitive scheduler)
        const scheduler = new Scheduler({ // schedule the arrival
          rate: this.agent.rate,
          duration: CONFIGURATION.flowDuration,
          paused: CONFIGURATION.paused,
          stop: ()=>destination.agent.receive(toPort, data, address, options),
        });
        this.gc = scheduler.start();
      });
    }else{
      this.gc = source.agent.on(`send:${port}`, (data, options)=>[destination.agent, this.agent].forEach(agent=>agent.receive(toPort, data, address, options)));
    }





  }


  stop(){
    console.info(this.id + ' agent stop!',)
    this.agent.stop()
    this.collectGarbage()
  }
}

class Modules extends Branch {

}

class Library extends Branch {
  register(id, descriptor){

    const tool = new Branch(id);
    tool.content.value = descriptor
    this.create(tool);
  }
}


class ToneComponent extends Branch {

}

class TonePlayerComponent extends ToneComponent {
  setup(){
    this.content.value = new this.Tone.Player(this.settings.snapshot);
    this.gc = this.settings.subscribe(()=>this.content.value.set(this.settings.snapshot));
  }
  connectable(req){
    return req.source.content.value instanceof ToneComponent;
  }
  connect(source){
    this.content.value.connect(source);
  }
  receive(request){
    // unused, tone passes its own data
  }
  disconnect(){
    this.discontent.value.connect(source);
  }
}
class ToneDestinationComponent extends ToneComponent {
  setup(){
    this.content.value = new this.Tone.Destination(this.settings.snapshot);
    this.gc = this.settings.subscribe(()=>this.content.value.set(this.settings.snapshot));
  }
  connectable(req){
    return req.source.content.value instanceof ToneComponent;
  }
  connect(source){
    this.content.value.connect(source);
  }
  receive(request){
    // unused, tone passes its own data
  }
  disconnect(){
    this.discontent.value.connect(source);
  }
}
class ToneDistortionComponent extends ToneComponent {
  setup(){
    this.content.value = new this.Tone.Distortion(this.settings.snapshot);
    this.gc = this.settings.subscribe(()=>this.content.value.set(this.settings.snapshot));
  }
  connectable(req){
    return req.source.content.value instanceof ToneComponent;
  }
  connect(source){
    this.content.value.connect(source);
  }
  receive(request){
    // unused, tone passes its own data
  }
  disconnect(){
    this.discontent.value.connect(source);
  }
}
class ToneFeedbackDelayComponent extends ToneComponent {
  setup(){
    this.content.value = new this.Tone.FeedbackDelay(this.settings.snapshot);
    this.gc = this.settings.subscribe(()=>this.content.value.set(this.settings.snapshot));
  }
  connectable(req){
    return req.source.content.value instanceof ToneComponent;
  }
  connect(source){
    this.content.value.connect(source);
  }
  receive(request){
    // unused, tone passes its own data
  }
  disconnect(){
    this.discontent.value.connect(source);
  }
}

// Boot
const application = new Application();

// Module Registration
const modules = new Modules('modules');
const toneLibrary = new Library('tone-js');
toneLibrary.register('player', TonePlayerComponent);
toneLibrary.register('destination', ToneDestinationComponent);
toneLibrary.register('distortion', ToneDistortionComponent);
toneLibrary.register('feedback-delay', ToneFeedbackDelayComponent);

modules.create(toneLibrary);
application.create(modules);

// Project Registration
const project = new Project('main-project');
application.create(project);

const mainLocation = new Location('main');
project.create(mainLocation);

const upperLocation = new Location('upper');
project.create(upperLocation);

const teeLocation = new Location('tee');
project.create(teeLocation);





project.load();
{
  // EXAMPLE project.load

  mainLocation.createModule('distortion1', 'tone-js/distortion',         {left: 100, top: 100}, {distortion: 0.4});
  mainLocation.createModule('feedback-delay1', 'tone-js/feedback-delay', {left: 100, top: 200}, {delayTime:0.125, feedback:0.5});
  mainLocation.createModule('destination1', 'tone-js/destination',       {left: 100, top: 300}, {});
  mainLocation.createModule('player1',      'tone-js/player',            {left: 100, top: 400}, { url: "https://tonejs.github.io/audio/berklee/gurgling_theremin_1.mp3", loop: true, autostart: true, } );

  mainLocation.createConnection('distortion1:out', 'destination1:in');
  mainLocation.createConnection('player1:out', 'distortion1:in');
  mainLocation.createConnection('player1:out', 'feedback-delay1:in');

}
project.startup();



//////// UI ////////
import UI from './src/UI.js';
const ui = new UI(application);
ui.start(); // WARN: must come after the tree has fully loaded, otherwise the watcher will begin adding nodes, that are yet to be loaded.
console.log(`Startup at ${new Date().toISOString()}`);
// window.addEventListener('beforeunload', function(event) {
//   //console.log('beforeunload was triggered!')
//   // ui.stop();
//   // project.shutdown();
// });
