import CONFIGURATION from 'configuration';

import baseInstaller from './library/base/index.js';
import toneInstaller from './library/tone-js/index.js';
import { Application, Project, Location, Component, Connector, Modules, Library } from 'library';

// Boot
const application = new Application();

// Module Registration
const modules = new Modules('modules');
application.create(modules);

modules.create(baseInstaller(application));
modules.create(toneInstaller(application));

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
  mainLocation.createModule('note1', 'scene-tools/note', {title:'Note', left: 66, top: 88}, {} );
  mainLocation.createModule('setting1', 'scene-tools/setting', {title:'Scene Setting', left: 333, top: 222}, {} );
  mainLocation.createModule('toast1', 'scene-tools/toast', {title:'Toast', left: 777, top: 444}, {});
  mainLocation.createConnection('setting1:value', 'toast1:text', {autostart: false});


  }

if(1){

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
application.state.initialize();
application.state.start();

ui.start(); // WARN: must come after the tree has fully loaded, otherwise the watcher will begin adding nodes, that are yet to be loaded.
console.log(`Startup at ${new Date().toISOString()}`);
// window.addEventListener('beforeunload', function(event) {
//   //console.log('beforeunload was triggered!')
//   // ui.stop();
//   // project.shutdown();
// });
