import { Library, Component, Tool } from 'library';

import Tone from './Tone.js';

class ToneComponent extends Component {
  Tone = Tone;
}


class ToneDestinationComponent extends ToneComponent {
  static caption = 'Destination';
  static description = 'A master output linked to the AudioDestinationNode (your speakers), offering volume control, muting, and the application of master effects, all managed through the global Tone.js Context.';
  static defaults = {};

  initialize() {
    this.channels.set('in', {icon: 'megaphone'});
  }

  start(){
    this.content.value = this.Tone.getDestination();
    //console.log('EEE ToneDestinationComponent',   this.content.value );
  }



  pause() {}
  resume() {}
  stop() {
    this.collectGarbage();
  }
  dispose() {}

}


class TonePlayerComponent extends ToneComponent {
  static caption = 'Player';
  static description = 'A versatile sample player for playing audio files, supporting various playback features like looping and playback rate adjustment.';
  static defaults = { url: {label:'Audio URL', type: 'URL', data:"https://tonejs.github.io/audio/loop/chords.mp3"}, loop: {label:'Loop', type:'Boolean', data:true}, autostart: {label:'Autostart', type:'Boolean', data:true}, };

  initialize() {
    this.channels.set('out', {side:'out', icon: 'soundwave'});
  }
  start(){
    //console.warn('TonePlayerComponent Start')
    this.content.value = new this.Tone.Player(this.settings.getConfigurationObject());
    for (const [name, options] of this.settings.getSettingsList() ){
        //this.gc = options.data.subscribe(v=>console.log(`Updating ${name} to`, v));
        this.gc = options.data.subscribe(v=>this.content.value[name]);
    }
  }

  pause() {}
  resume() {}
  stop() {
    this.collectGarbage();
  }
  dispose() {}







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


  pause() {}
  resume() {}
  stop() {
    this.collectGarbage();
  }
  dispose() {}


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
    this.channels.set('in', {icon: 'soundwave'});
    this.channels.set('out', {side:'out', icon: 'soundwave'});
  }
  start(){
    //console.log('Distortion Start!')
    this.content.value = new this.Tone.Distortion(this.settings.getConfigurationObject());
    for (const [name, options] of this.settings.getSettingsList() ){
        //this.gc = options.data.subscribe(v=>console.log(`Updating ${name} to`, v));
        this.gc = options.data.subscribe(v=>this.content.value[name]);
    }
  }


  pause() {}
  resume() {}
  stop() {
    this.collectGarbage();
  }
  dispose() {}


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
    this.channels.set('in', {icon: 'soundwave'});
    this.channels.set('out', {side:'out', icon: 'soundwave'});
  }
  start(){
    this.content.value = new this.Tone.FeedbackDelay(this.settings.getConfigurationObject());
    for (const [name, options] of this.settings.getSettingsList() ){
        //this.gc = options.data.subscribe(v=>console.log(`Updating ${name} to`, v));
        this.gc = options.data.subscribe(v=>this.content.value[name]);
    }
  }

  pause() {}
  resume() {}
  stop() {
    this.collectGarbage();
  }
  dispose() {}


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
    this.channels.set('events', {side:'out', icon:'music-note'});
  }

  start(){
    for (const [name, options] of this.settings.getSettingsList() ){
        //this.gc = options.data.subscribe(v=>console.log(`Updating ${name} to`, v));
        this.gc = options.data.subscribe(v=>this.content?.value?this.content.value[name]=v:0);
    }
  }


  pause() {}
  resume() {}
  stop() {
    this.collectGarbage();
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
    //console.log('toneOptions', toneOptions)
    const {values, pattern} = toneOptions;
    const callback = (time, note) => {
      destination.content.value.triggerAttackRelease(note, 0.1, time);
    };
    // Create
    if(!this.content.value) this.content.value = new this.Tone.Pattern(callback, values, pattern);

    // Start
    this.content.value.start();
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
  initialize() {}
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
  pause() {}
  resume() {}
  stop() {
    this.collectGarbage();
  }
  dispose() {}
}





export default function install(){

  const library = new ToneLibrary('tone-js');
  library.settings.name = 'Tone.js Components';

  library.register('distortion',    ToneDistortionComponent);
  library.register('feedbackdelay', ToneFeedbackDelayComponent);
  library.register('synth',         ToneSynthComponent);
  library.register('pattern',       TonePatternComponent);
  library.register('player',        TonePlayerComponent);
  library.register('destination',   ToneDestinationComponent);

  return library;
}
