import Signal from 'signal';
import Branch from 'branch';
import Commander from 'commander';
import Scheduler from 'scheduler';

import List from 'list';
// import State from 'state';


import CONFIGURATION from 'configuration';

class Application extends Branch {

  commander;
  activeLocation = new Signal('main');

  constructor(...a) {
    super(...a)
    this.commander = new Commander(this);
  }

  async start(){
    this.all.filter(o=>o!==this).map(node=>node.start?node.start():null);
  }

  async stop(){
    this.all.filter(o=>o!==this).map(node=>node.stop?node.stop():null);
  }

}

class Project extends Branch {

  // LIFECYCLE SYSTEM

  async load(url){
    ///console.log('TODO...');
  }
  async save(url){
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

class Location extends Branch {

  getRelated(id) { // return items related to id in a scene, usualy for removal.
    const from = this.children.filter(child=>child.type==='pipe').filter(child=>child.dataset.get('from')!==undefined).filter(child=>child.dataset.get('from').value.startsWith(id+':'));
    const to = this.children.filter(child=>child.type==='pipe').filter(child=>child.dataset.get('to')!==undefined).filter(child=>child.dataset.get('to').value.startsWith(id+':'));
    return [...from, ...to];
  }

  // 'distortion1', 'tone-js/distortion',         {left: 100, top: 100}, {distortion: 0.4}
  createModule(id, modulePath, dataset, settings){

    const path = ['modules',...modulePath.split('/')];
    const Component = application.get(...path).content.value;
    // Initialize important objects
    const component = new Component(id);
    component.type = 'window';
    // Assign options
    Object.entries(dataset).filter(([key,val])=>val).forEach(([key,val])=>component.dataset.set(key,val))
    component.settings.merge(settings);
    // Add to stage
    this.create(component);
    // do not autostart, you are just creating, not starting - start is a different process, it can be triggered by commands or load scripts
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
    // do not autostart, you are just creating, not starting - start is a different process, it can be triggered by commands or load scripts
    return connector;
  }
}


class Component extends Branch {
  rate = new Signal(1); // speed of emitting signals
  health = new Signal('nominal'); // component health


  constructor(id) {
    super(id, 'window')
  }

  initialize(){
    this.channels = new List();
  }

  pipes(name){
    return this.parent.filter(o=>o.type==='pipe'&&o.dataset.get('from').value===this.id + ':' + name);
  }

  connectable(){
    return true; //TODO: this should be false by default
  }
  connect(){
  }
  receive(port, data, address, options){
    this.emit('receive', port, data, address, options) // asap as data is received, (ex. trigger the ball rolling)
    this.execute(port, data, address, options); // NOTE: process is under user's control
  }
  disconnect(){
  }

  execute(port, data, address, options){
    console.warn('This method in meant to be overridden')
    this.pipes('out').forEach(pipe=>pipe.receive('in', data, this.id+':out', options));
  }
}
















class DataRequest {
  from = {id:null, port:null};
  to = {id:null, port:null};
  source = null;
  destination = null;
  constructor(context){
    // TODO: unknown.. cache and make reactive...
    Object.assign(this.from,
      Object.fromEntries(
        [context.dataset.get('from').value.split(':')].map( ([id,port])=>[['id',id],['port',port]]).flat()
      )
    );
    Object.assign(this.to,
      Object.fromEntries(
        [context.dataset.get('to').value.split(':')].map( ([id,port])=>[['id',id],['port',port]]).flat()
      )
    );
    this.source      = context.parent.get(this.from.id);
    this.destination = context.parent.get(this.to.id);
  }
}

class ConnectionRequest extends DataRequest {

}
class TransportationRequest extends DataRequest {
  data = null;
  options = null;
  constructor(context, data, options){
    super(context);
    this.data = data;
    this.options = options;
  }
}
class Connector extends Branch {
  #connectionRequest;
  rate = new Signal(1); // speed of transmitting signals
  health = new Signal('nominal'); // component health
  constructor(id) {
    super(id, 'pipe');
  }

  /**
  * Pipe receive, when a pipe receives data, it passes it to the destination
   */
  receive(data, options){
      const transportationRequest = new TransportationRequest(this, data, options);
      if(CONFIGURATION.simulation.value === true){
        const scheduler = new Scheduler({ // schedule the arrival
        rate: this.rate,
        duration: CONFIGURATION.flowDuration,
        paused: CONFIGURATION.paused,
        stop: ()=>destination.receive(transportationRequest),
        });
        this.gc = scheduler.start();
      }else{
        destination.receive(transportationRequest);
      }
  }


  start(){
    console.warn('Investigate time travel');
    setTimeout(()=>{
      const request = new ConnectionRequest(this);
      const isConnectable = request.source.connectable(request);

      if(isConnectable){
        //NOTE: if request is denied, it is not stored so that stop is not called.
        request.source.connect(request);
        this.#connectionRequest = request;
      }else{
        console.warn('NOT CONNECTABLE!');
        this.remove()
      }

    }, 1);
  }

  stop(){
    if(this.#connectionRequest) this.#connectionRequest.source.disconnect(this.#connectionRequest);
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





















import Tone from './extensions/tone/Tone.js';

class ToneComponent extends Component {
  Tone = Tone;
}

class ToneDestinationComponent extends ToneComponent {

  initialize() {
    super.initialize()
    this.channels.set('in', {icon: 'megaphone'});
  }

  start(){
    this.content.value = this.Tone.getDestination();
    console.log('EEE ToneDestinationComponent',   this.content.value );
  }

}










class TonePlayerComponent extends ToneComponent {
  initialize() {
    super.initialize()
    this.channels.set('out', {side:'out', icon: 'soundwave'});
  }
  start(){
    console.warn('TonePlayerComponent Start')
    this.content.value = new this.Tone.Player(this.settings.getData());
    //TODO: subscribe to value changes
  }
  connectable({from, source, to, destination}){
    // WARNING: VERY BASIC TEST
    const isCorrectInstance = destination instanceof ToneComponent;
    const isCompatiblePorts = ((to.port==from.port)||(from.port=='out'&&to.port=='in'));
    return [isCorrectInstance,isCompatiblePorts].every(o=>o);
  }
  connect({destination}){
    this.content.value.connect(destination.content.value)
  }
  disconnect({destination}){
     this.Tone.disconnect(this.content.value, destination.content.value);
  }
}









class ToneSynthComponent extends ToneComponent {
  initialize() {
    super.initialize()
    this.channels.set('events', {side:'in', icon:'music-note'});
    this.channels.set('out', {side:'out', icon: 'soundwave'});
     //TODO: this.channels.set('events', {allow: (o)=> o instanceof this.tone.ToneEvent, icon:'music-note' });
  }
  start(){
    this.content.value = new this.Tone.PolySynth(this.settings.getData());
    //TODO: subscribe to value changes
  }
  connectable({from, source, to, destination}){
    // WARNING: VERY BASIC TEST
    const isCorrectInstance = destination instanceof ToneComponent;
    const isCompatiblePorts = ((to.port==from.port)||(from.port=='out'&&to.port=='in'));
    return [isCorrectInstance,isCompatiblePorts].every(o=>o);
  }
  connect({destination}){
    this.content.value.connect(destination.content.value)
  }
  disconnect({destination}){
     this.Tone.disconnect(this.content.value, destination.content.value);
  }
}




class ToneDistortionComponent extends ToneComponent {
  initialize() {
    super.initialize()
    this.channels.set('in', {icon: 'soundwave'});
    this.channels.set('out', {side:'out', icon: 'soundwave'});
  }
  start(){
    console.log('Distortion Start!')
    this.content.value = new this.Tone.Distortion(this.settings.getData());
    //TODO: subscribe to value changes
  }
  connectable({from, source, to, destination}){
    // WARNING: VERY BASIC TEST
    const isCorrectInstance = destination instanceof ToneComponent;
    const isCompatiblePorts = ((to.port==from.port)||(from.port=='out'&&to.port=='in'));
    return [isCorrectInstance,isCompatiblePorts].every(o=>o);
  }
  connect({destination}){
    this.content.value.connect(destination.content.value)
  }
  disconnect({destination}){
     this.Tone.disconnect(this.content.value, destination.content.value);
  }
}





class ToneFeedbackDelayComponent extends ToneComponent {
  initialize() {
    super.initialize()
    this.channels.set('in', {icon: 'soundwave'});
    this.channels.set('out', {side:'out', icon: 'soundwave'});
  }
  start(){
    this.content.value = new this.Tone.FeedbackDelay(this.settings.getData());
    //TODO: subscribe to value changes
  }
  connectable({from, source, to, destination}){
    // WARNING: VERY BASIC TEST
    const isCorrectInstance = destination instanceof ToneComponent;
    const isCompatiblePorts = ((to.port==from.port)||(from.port=='out'&&to.port=='in'));
    return [isCorrectInstance,isCompatiblePorts].every(o=>o);
  }
  connect({destination}){
    this.content.value.connect(destination.content.value)
  }
  disconnect({destination}){
     this.Tone.disconnect(this.content.value, destination.content.value);
  }
}





class TonePatternComponent extends ToneComponent {
  l(...a){console.log(this.constructor.name, ...a)}
  initialize() {
    super.initialize()
    this.channels.set('events', {side:'out', icon:'music-note'});
  }
  connectable({from, source, to, destination}){
    // WARNING: VERY BASIC TEST
    const isCorrectInstance = destination instanceof ToneComponent;
    const isCompatiblePorts = ((to.port==from.port)||(from.port=='out'&&to.port=='in'));
    return [isCorrectInstance,isCompatiblePorts].every(o=>o);
  }

  connect({destination}){ // when something is connected to you

    // Prepare
    const toneOptions = this.settings.getData();
    console.log('toneOptions', toneOptions)
    const {values, pattern} = toneOptions;
    const callback = (time, note) => {
      destination.content.value.triggerAttackRelease(note, 0.1, time);
    };
    // Create
    if(!this.content.value) this.content.value = new this.Tone.Pattern(callback, values, pattern);
    //TODO: subscribe to value changes
    // Start
    this.content.value.start();
  }


  execute(request){
    // unused, tone passes its own data
  }

  disconnect({destination}){
    // if( this.content?.value)
      this.content.value.stop();
    // WARNING: there is nothing to disconnect here,
    // we are just feeding values up to destination, so we just stop doing so.
  }

  dispose(){
    this.content.value.dispose();
  }

}









class ToneLibrary extends Library {
  start(){

    const installTone = async () => {
      // Tone.getTransport() returns the main timekeeper.
      Tone.getTransport().start(); // All loops start when Transport is started
      // Tone.getTransport().bpm.rampTo(800, 10); // ramp up to 800 bpm over 10 seconds
      console.info("The main timekeeper has been:", Tone.getTransport().state);
      document.body.removeEventListener("mousedown", installTone, true);
    }
    document.body.addEventListener("mousedown", installTone, true);

  } // start
}



// Boot
const application = new Application();

// Module Registration
const modules = new Modules('modules');
const toneLibrary = new ToneLibrary('tone-js');

toneLibrary.register('destination', ToneDestinationComponent);

toneLibrary.register('distortion', ToneDistortionComponent);
toneLibrary.register('feedbackdelay', ToneFeedbackDelayComponent);

toneLibrary.register('synth', ToneSynthComponent);
toneLibrary.register('player', TonePlayerComponent);
toneLibrary.register('pattern', TonePatternComponent);


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

  mainLocation.createModule('pattern1', 'tone-js/pattern',               {title:'pattern1', left: 66, top: 222}, {values:{type:'Array', data:["C4", ["E4", "D4", "E4"], "G4", ["A4", "G4"]] }, pattern:{type:'Enum', options:[{value:'upDown', textContent:'upDown'}, {value:'downUp', textContent:'downUp'}], data:"upDown"},});
  mainLocation.createModule('synth1', 'tone-js/synth',                   {title:'synth1', left: 555, top: 222}, {});
  mainLocation.createModule('distortion1', 'tone-js/distortion',         {title:'distortion1', left: 1111, top: 666}, {distortion: {type:'Float', data:0.2, min:0, max:1, step:0.1}});
  mainLocation.createModule('feedbackdelay1', 'tone-js/feedbackdelay',   {title:'feedbackdelay1', left: 555, top: 444}, {delayTime:{data:0.125}, feedback:{data:0.5}});
  mainLocation.createModule('destination1', 'tone-js/destination',       {title:'destination1', left: 1111, top: 77}, {});
  mainLocation.createModule('player1',      'tone-js/player',            {title:'player1', left: 222, top: 555}, { url: {type: 'URL', data:"https://tonejs.github.io/audio/loop/chords.mp3"}, loop: {type:'Boolean', data:true}, autostart: {type:'Boolean', data:true}, } );

  // mainLocation.createConnection('pattern1:out', 'synth1:in');
  mainLocation.createConnection('synth1:out', 'destination1:in', {autostart: false});
  // mainLocation.createConnection('distortion1:out', 'destination1:in');
  // mainLocation.createConnection('player1:out', 'feedbackdelay1:in');
  mainLocation.createConnection('feedbackdelay1:out', 'destination1:in', {autostart: false});

}



//////// UI ////////
import UI from './src/UI.js';
const ui = new UI(application);
application.start();
ui.start(); // WARN: must come after the tree has fully loaded, otherwise the watcher will begin adding nodes, that are yet to be loaded.
console.log(`Startup at ${new Date().toISOString()}`);
// window.addEventListener('beforeunload', function(event) {
//   //console.log('beforeunload was triggered!')
//   // ui.stop();
//   // project.shutdown();
// });
