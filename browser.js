import Signal from 'signal';
import Branch from 'branch';
import Commander from 'commander';
import Scheduler from 'scheduler';

import Setings from 'settings';
import State from 'state';


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
    Object.entries(settings).filter(([key,val])=>val).forEach(([key,val])=>component.settings.set(key,val))
    // Add to stage
    this.create(component);
    // console.dir(this.children)
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
    connector.start(); // NOTE: this is a new component that has just been added, it must be manually started.

    return connector;
  }
}


class Component extends Branch {
  rate = new Signal(1); // speed of emitting signals
  settings = new Setings();
  health = new Signal('nominal'); // component health


  constructor(id) {
    super(id, 'window')
    this.dataset.set('port-in', true);
    this.dataset.set('port-out', true);
  }

  pipes(name){
    return this.parent.filter(o=>o.type==='pipe'&&o.dataset.get('from').value===this.id + ':' + name);
  }

  connectable(source){
  }
  connect(source){
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


class Connector extends Branch {
  rate = new Signal(1); // speed of transmitting signals
  health = new Signal('nominal'); // component health

  constructor(id) {
    super(id, 'pipe');
  }

  start(){

    const address = this.dataset.get('from').value.split(':');
    const [fromId, port] = address;
    const [toId, toPort] = this.dataset.get('to').value.split(':');
    const source      = this.parent.get(fromId);
    const destination = this.parent.get(toId);

    console.warn('Investigate time travel');
    setTimeout(()=>{
      if('connectSource' in destination) destination.connectSource(source);
      if('connectDestination' in source) source.connectDestination(destination);
    },1)

  }


  /**
  * Pipe receive, when a pipe receives data, it passes it to the destination
   */
  // receive(port, data, address, options){
  receive(data, options){

    const address = this.dataset.get('from').value.split(':');
    const [fromId, port] = address;
    const [toId, toPort] = this.dataset.get('to').value.split(':');
    const source      = this.parent.get(fromId);
    const destination = this.parent.get(toId);


      if(CONFIGURATION.simulation.value === true){
        const scheduler = new Scheduler({ // schedule the arrival
        rate: this.rate,
        duration: CONFIGURATION.flowDuration,
        paused: CONFIGURATION.paused,
        stop: ()=>destination.receive(toPort, data, address, options),
        });
        this.gc = scheduler.start();
    }else{
      destination.receive(toPort, data, address, options);
    }

  }

  stop(){
    const address = this.dataset.get('from').value.split(':');
    const [fromId, port] = address;
    const [toId, toPort] = this.dataset.get('to').value.split(':');
    const source      = this.parent.get(fromId);
    const destination = this.parent.get(toId);
    if('disconnectSource' in destination) destination.disconnectSource(source);
    if('disconnectDestination' in source) source.disconnectDestination(destination);
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

  connectable(req){
    return req.source.content.value instanceof ToneComponent;
  }

  connectSource(source){
    console.log('ToneDestinationComponent: connectSource', source)
    source.content.value.toDestination()
  }
  disconnectSource(source){
    this.Tone.disconnect(source.content.value);
  }

}










class TonePlayerComponent extends ToneComponent {
  start(){
    console.warn('TonePlayerComponent Start')
    this.content.value = new this.Tone.Player(this.settings.snapshot);
    this.gc = this.settings.subscribe(()=>this.content.value.set(this.settings.snapshot));
  }
  connectable(req){
    return req.source.content.value instanceof ToneComponent;
  }
  connectSource(source){
    source.content.value.connect(this.content.value);
  }
  disconnectSource(source){
    // this.Tone.disconnect(this.content.value, source.content.value);
     this.Tone.disconnect(source.content.value, this.content.value);
  }
}









class ToneSynthComponent extends ToneComponent {
  start(){
    this.content.value = new this.Tone.Synth(this.settings.snapshot);
    this.gc = this.settings.subscribe(()=>this.content.value.set(this.settings.snapshot));
  }
  connectable(req){
    return req.source.content.value instanceof ToneComponent;
  }
  // connectSource(source){
  //   source.content.value.connect(this.content.value);
  // }
  // disconnectSource(source){
  //   this.Tone.disconnect(source.content.value);
  // }
}




class ToneDistortionComponent extends ToneComponent {
  start(){
    console.log('Distortion Start!')
    this.content.value = new this.Tone.Distortion(this.settings.snapshot);
    this.gc = this.settings.subscribe(()=>this.content.value.set(this.settings.snapshot));
  }
  connectable(req){
    return req.source.content.value instanceof ToneComponent;
  }
  connectSource(source){
    source.content.value.connect(this.content.value);
  }
  disconnectSource(source){
     this.Tone.disconnect(source.content.value, this.content.value);

  }
}





class ToneFeedbackDelayComponent extends ToneComponent {
  start(){
    this.content.value = new this.Tone.FeedbackDelay(this.settings.snapshot);
    this.gc = this.settings.subscribe(()=>this.content.value.set(this.settings.snapshot));
  }
  connectable(req){
    return req.source.content.value instanceof ToneComponent;
  }
  connectSource(source){
    source.content.value.connect(this.content.value);
  }
  disconnectSource(source){
     this.Tone.disconnect(source.content.value, this.content.value);

  }
}





class TonePatternComponent extends ToneComponent {

  connectable(req){
    return req.source.content.value instanceof ToneComponent;
  }

  connectDestination(destination){ // when something is connected to you

    const {values, pattern} = this.settings.snapshot;
    this.content.value = new this.Tone.Pattern((time, note) => {
      this.patternPayload(destination, time, note);
    }, values, pattern);

    this.content.value.start();
    Tone.Transport.start();

    console.log('Tone.Pattern: connectDestination',  destination.content.value)

  }
  patternPayload(destination, time, note){
    if(this.content.value.state == 'stopped') return;
      try{
        destination.content.value.triggerAttackRelease(note, 0.1, time);
      }catch(e){
        console.info(e)
      }
  }

  execute(request){
    // unused, tone passes its own data
  }
  disconnectDestination(destination){
    console.log('disconnectDestination', destination.id)
    // this.content.value.cancel( Tone.now() );
    // this.content.value.stop( Tone.now() );
    this.content.value.stop(  );
    console.log('disconnectDestination state:', this.content.value.state);

     this.Tone.disconnect(destination.content.value, this.content.value);

  }
}









class ToneLibrary extends Library {
  start(){
  document.body.addEventListener("mousedown", async () => {
    await Tone.start();
    console.log("audio is ready");
  },true);
  }
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

  mainLocation.createModule('pattern1', 'tone-js/pattern',         {title:'pattern1', left: 66, top: 222}, {values:["C2", "D4", "E5", "A6"], pattern:"upDown",});
  mainLocation.createModule('synth1', 'tone-js/synth',         {title:'synth1', left: 555, top: 222}, {values:["C2", "D4", "E5", "A6"], pattern:"upDown",});
  // mainLocation.createModule('distortion1', 'tone-js/distortion',         {title:'distortion1', left: 888, top: 333}, {distortion: 0.4});
  mainLocation.createModule('feedbackdelay1', 'tone-js/feedbackdelay',   {title:'feedbackdelay1', left: 555, top: 444}, {delayTime:0.125, feedback:0.5});
  mainLocation.createModule('destination1', 'tone-js/destination',       {title:'destination1', left: 1111, top: 77}, {});
  mainLocation.createModule('player1',      'tone-js/player',            {title:'player1', left: 222, top: 555}, { url: "https://tonejs.github.io/audio/loop/chords.mp3", loop: true, autostart: true, } );

  // mainLocation.createConnection('pattern1:out', 'synth1:in');
  mainLocation.createConnection('synth1:out', 'destination1:in');
  // mainLocation.createConnection('distortion1:out', 'destination1:in');
  // mainLocation.createConnection('player1:out', 'feedbackdelay1:in');
  mainLocation.createConnection('feedbackdelay1:out', 'destination1:in');

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
