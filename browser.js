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
    const module = application.get(...path);
    const Component = module.content.value;
    // Initialize important objects
    const component = new Component(id);
    component.type = 'window';

    // Assign options
    if(!dataset.title) dataset.title = module.settings.name;
    Object.entries(dataset).filter(([key,val])=>val).forEach(([key,val])=>component.dataset.set(key,val));

    component.settings.merge({...Component.defaults, ...settings});

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
  register(id, content){
    const tool = new Branch(id);
    tool.content.value = content
    tool.settings.name = content.caption;
    tool.settings.description = content.description;
    this.create(tool);
  }
}




















import Tone from './extensions/tone/Tone.js';

class ToneComponent extends Component {
  Tone = Tone;
}


class ToneDestinationComponent extends ToneComponent {
  static caption = 'Destination';
  static description = 'A master output linked to the AudioDestinationNode (your speakers), offering volume control, muting, and the application of master effects, all managed through the global Tone.js Context.';
  static defaults = {};

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
  static caption = 'Player';
  static description = 'A versatile sample player for playing audio files, supporting various playback features like looping and playback rate adjustment.';
  static defaults = { url: {label:'Audio URL', type: 'URL', data:"https://tonejs.github.io/audio/loop/chords.mp3"}, loop: {label:'Loop', type:'Boolean', data:true}, autostart: {label:'Autostart', type:'Boolean', data:true}, };

  initialize() {
    super.initialize()
    this.channels.set('out', {side:'out', icon: 'soundwave'});
  }
  start(){
    console.warn('TonePlayerComponent Start')
    this.content.value = new this.Tone.Player(this.settings.getConfigurationObject());
    for (const [name, options] of this.settings.getSettingsList() ){
        this.gc = options.data.subscribe(v=>console.log(`Updating ${name} to`, v));
        this.gc = options.data.subscribe(v=>this.content.value[name]);
    }
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
  static caption = 'Synth';
  static description = 'A sound synthesizer that generates audio signals configurable through various synthesizer settings.';
  static defaults = {};

  initialize() {
    super.initialize()
    this.channels.set('events', {side:'in', icon:'music-note'});
    this.channels.set('out', {side:'out', icon: 'soundwave'});
     //TODO: this.channels.set('events', {allow: (o)=> o instanceof this.tone.ToneEvent, icon:'music-note' });
  }
  start(){
    this.content.value = new this.Tone.PolySynth(this.settings.getConfigurationObject());
    for (const [name, options] of this.settings.getSettingsList() ){
        this.gc = options.data.subscribe(v=>console.log(`Updating ${name} to`, v));
        this.gc = options.data.subscribe(v=>this.content.value[name]);
    }
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
  static caption = 'Distortion';
  static description = 'A waveform alteration effect that adds harmonic distortion, which can enhance the sound by adding complexity and warmth.';
  static defaults = {distortion: {label:'Distortion Ammount', type:'Float', data:0.2, min:0, max:1, step:0.01}};

  initialize() {
    super.initialize()
    this.channels.set('in', {icon: 'soundwave'});
    this.channels.set('out', {side:'out', icon: 'soundwave'});
  }
  start(){
    console.log('Distortion Start!')
    this.content.value = new this.Tone.Distortion(this.settings.getConfigurationObject());
    for (const [name, options] of this.settings.getSettingsList() ){
        this.gc = options.data.subscribe(v=>console.log(`Updating ${name} to`, v));
        this.gc = options.data.subscribe(v=>this.content.value[name]);
    }
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
  static caption = 'Feedback Delay';
  static description = 'A sound delay effect where the output is fed back into the input, creating a repetitive, echo-like effect.';
  static defaults = {delayTime:{label:'Delay Time', type:'Text', data:0.125,}, feedback:{label:'Feedback', type:'Float', data:0.5, min:0, max:1, step:0.01}};

  initialize() {
    super.initialize()
    this.channels.set('in', {icon: 'soundwave'});
    this.channels.set('out', {side:'out', icon: 'soundwave'});
  }
  start(){
    this.content.value = new this.Tone.FeedbackDelay(this.settings.getConfigurationObject());
    for (const [name, options] of this.settings.getSettingsList() ){
        this.gc = options.data.subscribe(v=>console.log(`Updating ${name} to`, v));
        this.gc = options.data.subscribe(v=>this.content.value[name]);
    }
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
  static caption = 'Pattern';
  static description = 'A sequencer for playing musical patterns, with customizable values and patterns to control the rhythm and order of playback.';
  static defaults = {values:{label:'Tonal Values', type:'Array', data:["C4", ["E4", "D4", "E4"], "G4", ["A4", "G4"]] }, pattern:{label: 'Arpeggio Pattern', type:'Enum', options:[{value:'up', textContent:'up'},  {value:'down', textContent:'down'},  {value:'upDown', textContent:'upDown'},  {value:'downUp', textContent:'downUp'},  {value:'alternateUp', textContent:'alternateUp'},  {value:'alternateDown', textContent:'alternateDown'},  {value:'random', textContent:'random'},  {value:'randomOnce',
    textContent:'randomOnce'},  {value:'randomWalk', textContent:'randomWalk'},], data:"upDown"},};

  l(...a){console.log(this.constructor.name, ...a)}
  initialize() {
    super.initialize()
    this.channels.set('events', {side:'out', icon:'music-note'});
  }
  start(){
    for (const [name, options] of this.settings.getSettingsList() ){
        this.gc = options.data.subscribe(v=>console.log(`Updating ${name} to`, v));
        this.gc = options.data.subscribe(v=>this.content?.value?this.content.value[name]=v:0);
    }
  }
  connectable({from, source, to, destination}){
    // WARNING: VERY BASIC TEST
    const isCorrectInstance = destination instanceof ToneComponent;
    const isCompatiblePorts = ((to.port==from.port)||(from.port=='out'&&to.port=='in'));
    return [isCorrectInstance,isCompatiblePorts].every(o=>o);
  }

  connect({destination}){ // when something is connected to you

    // Prepare
    const toneOptions = this.settings.getConfigurationObject();
    console.log('toneOptions', toneOptions)
    const {values, pattern} = toneOptions;
    const callback = (time, note) => {
      destination.content.value.triggerAttackRelease(note, 0.1, time);
    };
    // Create
    if(!this.content.value) this.content.value = new this.Tone.Pattern(callback, values, pattern);

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
    // NOTE: this component is only started when connected, thus, we must check if there is anything to dispose.
    this.content?.value?.dispose();
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















class SceneComponent extends Component {
  // All items from the signal category inherit this
  // Something = Something;
}


class SceneNoteComponent extends SceneComponent {
  static caption = 'Note';
  static description = 'Leave a note on the scene.';
  static defaults = {text:{label:'Message', type:'Text', data: 'Life cycle management is incomplete, so there are some odd behaviours.'}};

  initialize(){
    super.initialize()
  }

    start(){}

}

class SceneToastComponent extends SceneComponent {
  static caption = 'Toast';
  static description = 'Show a message.';
  static defaults = {};

  initialize(){
    super.initialize()
    this.channels.set('text', {side:'in', icon:'activity'});
  }

  start(){}


  connect(){}

  execute(){}

  disconnect(){}

  dispose(){}

}

class SceneSettingComponent extends SceneComponent {
  static caption = 'Scene Setting';
  static description = 'Monitor a scene setting, and pass the value along if it changes.';
  static defaults = {};

  initialize(){
    super.initialize()
    this.channels.set('value', {side:'out', icon:'activity'});
  }

  start(){}

  // am I connectable to destination
  connectable(req){return true;}


  connect(){}

  execute(){}

  disconnect(){}

  dispose(){}


}


// class SignalComponent extends Component {
//   // All items from the signal category inherit this
//   // Something = Something;
// }


// class SignalSettingComponent extends SignalComponent {
//   static caption = 'Scene Setting';
//   static description = 'A setting accesses .settings in the scene it is stored in';
//   static defaults = {};

//   initialize(){
//     super.initialize()
//     this.channels.set('value', {side:'out', icon:'activity'});
//   }

//   start(){}

//   connectable(){}

//   connect(){}

//   execute(){}

//   disconnect(){}

//   dispose(){}


// }









// Boot
const application = new Application();

// Module Registration
const modules = new Modules('modules');






const sceneLibrary = new Library('js-signals');
sceneLibrary.settings.name = 'Scene Tools';
modules.create(sceneLibrary);
sceneLibrary.register('note',   SceneNoteComponent);
sceneLibrary.register('toast',   SceneToastComponent);
sceneLibrary.register('setting', SceneSettingComponent);

// const signalsLibrary = new Library('js-signals');
// signalsLibrary.settings.name = 'Signal Toolbox';
// modules.create(signalsLibrary);
// signalsLibrary.register('signal', {}, 'Signal');
// signalsLibrary.register('setting', SignalSettingComponent, 'Setting');


const toneLibrary = new ToneLibrary('tone-js');
toneLibrary.settings.name = 'Tone.js Components';
modules.create(toneLibrary);
toneLibrary.register('distortion',    ToneDistortionComponent);
toneLibrary.register('feedbackdelay', ToneFeedbackDelayComponent);
toneLibrary.register('synth',         ToneSynthComponent);
toneLibrary.register('pattern',       TonePatternComponent);
toneLibrary.register('player',        TonePlayerComponent);
toneLibrary.register('destination',   ToneDestinationComponent);

// const signalsLibrary = new ToneLibrary('js-signals');
// signalsLibrary.settings.name = 'Signal Toolbox';
// modules.create(signalsLibrary);
// signalsLibrary.register('signal', {}, 'Signal');
// signalsLibrary.register('muffler', {}, 'Muffler');
// signalsLibrary.register('transformer', {}, 'Transformer');
// signalsLibrary.register('defer', {}, 'Defer');
// signalsLibrary.register('debounce', {}, 'Debounce');

// const observablesLibrary = new ToneLibrary('js-observables');
// observablesLibrary.settings.name = 'Observable Toolkit';
// modules.create(observablesLibrary);
// observablesLibrary.register('combine-latest', {}, 'combineLatest');

// const eventEmitterLibrary = new ToneLibrary('event-emitter');
// eventEmitterLibrary.settings.name = 'Event Emitter';
// modules.create(eventEmitterLibrary);

// const webStreamsLibrary = new ToneLibrary('web-streams');
// webStreamsLibrary.settings.name = 'WebStream Tools';
// modules.create(webStreamsLibrary);














application.create(modules);

// Project Registration
const project = new Project('main-project');
application.create(project);

const mainLocation = new Location('main');
mainLocation.settings.merge({title: 'Main'});
project.create(mainLocation);

const musicLocation = new Location('music');
musicLocation.settings.merge({title: 'Music'});
project.create(musicLocation);

const teeLocation = new Location('tee');
teeLocation.settings.merge({title: 'Tee Example'});
project.create(teeLocation);




project.load();
{
  mainLocation.createModule('note1', 'js-signals/note', {title:'Note', left: 66, top: 88}, {} );
  mainLocation.createModule('setting1', 'js-signals/setting', {title:'Scene Setting', left: 333, top: 222}, {} );
  mainLocation.createModule('toast1', 'js-signals/toast', {title:'Toast', left: 777, top: 444}, {});

  mainLocation.createConnection('setting1:value', 'toast1:text', {autostart: false});


  }
{
  // EXAMPLE project.load

  musicLocation.createModule('pattern1', 'tone-js/pattern',               {title:'pattern1', left: 66, top: 222}, {values:{label:'Tonal Values', type:'Array', data:["C4", ["E4", "D4", "E4"], "G4", ["A4", "G4"]] }, pattern:{label: 'Arpeggio Pattern', type:'Enum', options:[{value:'up', textContent:'up'},  {value:'down', textContent:'down'},  {value:'upDown', textContent:'upDown'},  {value:'downUp', textContent:'downUp'},  {value:'alternateUp', textContent:'alternateUp'},  {value:'alternateDown', textContent:'alternateDown'},  {value:'random', textContent:'random'},  {value:'randomOnce', textContent:'randomOnce'},  {value:'randomWalk', textContent:'randomWalk'},], data:"upDown"},});
  musicLocation.createModule('synth1', 'tone-js/synth',                   {title:'synth1', left: 555, top: 222}, {});
  musicLocation.createModule('distortion1', 'tone-js/distortion',         {title:'distortion1', left: 1111, top: 666}, {distortion: {label:'Distortion Ammount', type:'Float', data:0.2, min:0, max:1, step:0.01}});
  musicLocation.createModule('feedbackdelay1', 'tone-js/feedbackdelay',   {title:'feedbackdelay1', left: 555, top: 444}, {delayTime:{label:'Delay Time', type:'Text', data:0.125,}, feedback:{label:'Feedback', type:'Float', data:0.5, min:0, max:1, step:0.01}});
  musicLocation.createModule('destination1', 'tone-js/destination',       {title:'destination1', left: 1111, top: 77}, {});
  musicLocation.createModule('player1',      'tone-js/player',            {title:'player1', left: 222, top: 555}, { url: {label:'Audio URL', type: 'URL', data:"https://tonejs.github.io/audio/loop/chords.mp3"}, loop: {label:'Loop', type:'Boolean', data:true}, autostart: {label:'Autostart', type:'Boolean', data:true}, } );

  // mainLocation.createConnection('pattern1:out', 'synth1:in');
  musicLocation.createConnection('synth1:out', 'destination1:in', {autostart: false});
  // mainLocation.createConnection('distortion1:out', 'destination1:in');
  // mainLocation.createConnection('player1:out', 'feedbackdelay1:in');
  musicLocation.createConnection('feedbackdelay1:out', 'destination1:in', {autostart: false});

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
