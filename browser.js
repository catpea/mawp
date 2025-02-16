import CONFIGURATION from 'configuration';

import baseInstaller from './library/base/index.js';
import browserInstaller from './library/browser/index.js';
import toneInstaller from './library/tone-js/index.js';
import { Application, Project, Location, Component, Connector, Modules, Library } from 'library';

// Boot
const application = new Application();

// Module Registration
const modules = new Modules('modules');
application.create(modules);

modules.create(baseInstaller(application));
// modules.create(browserInstaller(application));
modules.create(toneInstaller(application));

// Project Registration
const project = new Project('main-project');
application.create(project);

const mainLocation = new Location('main');
mainLocation.settings.merge({title: 'Main'});
project.create(mainLocation);

const teeLocation = new Location('tee');
teeLocation.settings.merge({title: 'Text Transformation'});
project.create(teeLocation);

const musicLocation = new Location('music');
musicLocation.settings.merge({title: 'Music Example'});
project.create(musicLocation);




project.load();

{
  mainLocation.createModule('note0',    'system-tools/note',    {left: 66, top: 111, width: 333, }, {text: {type:'Text', title:'Notice', subtitle:'display will ignore the beacon counter until you send some text', text: 'Waiting for all pipes to submit information is a way to control execution of complex machines.', subtext:'Practical applications: this is the techonogy behing smart applicaions, this is what makes the brain operate in correct sequence.'}} );
  mainLocation.createModule('beacon0',   'system-tools/beacon', {left: 444, top: 111});
  mainLocation.createModule('text0',   'system-tools/text', {left: 444, top: 444});
  mainLocation.createModule('display0',   'system-tools/display', {left: 888, top: 333});
  mainLocation.createConnection('beacon0:out', 'display0:in');
  mainLocation.createConnection('text0:out', 'display0:in');







  // mainLocation.createModule('code1', 'system-tools/code', {title:'Code', left: 444, top: 555, width: 200} );
  mainLocation.createModule('note1',    'system-tools/note',    {title:'My Todo List', left: 66, top: 1111, width: 333, }, {text: {type:'Text', title:'Advanced Data Processing', subtitle:'data integration layer', text: 'Add Fetch, Queue, Manager, and File System. And allow the work manager to loop data through another scene.', subtext:'Later: Add more form controls, insert node by dropping it on line, magnetic connection by positioning connection near a port, and minimap.'}} );
  mainLocation.createModule('text1', 'system-tools/text', {title:'Text', left: 444, top: 1111, width: 200} );
  mainLocation.createModule('procedure1', 'system-tools/procedure', {title:'Procedure', left: 777, top: 1111, width: 200} );
  mainLocation.createModule('display1', 'system-tools/display', {title:'Display', left: 1111, top: 1111, width: 300} );
  mainLocation.createConnection('text1:out', 'procedure1:in');
  mainLocation.createConnection('procedure1:out', 'display1:in');








  mainLocation.createModule('fetch1',   'system-tools/fetch',   {title:'JSON Fetch', left: 66, top: 1555} );
  mainLocation.createModule('queue1',   'system-tools/queue',   {title:'Data Queue', left: 444, top: 1555, width: 200} );
  mainLocation.createModule('manager1', 'system-tools/manager', {title:'Work Manager', left: 772, top: 1555, width: 200} );

  mainLocation.createModule('files1',   'system-tools/files',   {title:'Virtual File System', left: 1120, top: 1555} );

  mainLocation.createConnection('fetch1:out', 'queue1:in');
  mainLocation.createConnection('queue1:out', 'manager1:in');
  mainLocation.createConnection('manager1:out', 'files1:in');


}

if(1){

  musicLocation.createModule('pattern1', 'tone-js/pattern',               {title:'pattern1', left: 66, top: 222}, {values:{label:'Tonal Values', type:'Array', data:["C4", ["E4", "D4", "E4"], "G4", ["A4", "G4"]] }, pattern:{label: 'Arpeggio Pattern', type:'Enum', options:[{value:'up', textContent:'up'},  {value:'down', textContent:'down'},  {value:'upDown', textContent:'upDown'},  {value:'downUp', textContent:'downUp'},  {value:'alternateUp', textContent:'alternateUp'},  {value:'alternateDown', textContent:'alternateDown'},  {value:'random', textContent:'random'},  {value:'randomOnce', textContent:'randomOnce'},  {value:'randomWalk', textContent:'randomWalk'},], data:"upDown"},});
  musicLocation.createModule('synth1', 'tone-js/synth',                   {title:'synth1', left: 555, top: 222}, {});
  musicLocation.createModule('distortion1', 'tone-js/distortion',         {title:'distortion1', left: 1111, top: 666}, {distortion: {label:'Distortion Ammount', type:'Float', data:0.2, min:0, max:1, step:0.01}});
  musicLocation.createModule('feedbackdelay1', 'tone-js/feedbackdelay',   {title:'feedbackdelay1', left: 555, top: 444}, {delayTime:{title:'Delay Time', type:'Text', data:0.125,}, feedback:{label:'Feedback', type:'Float', data:0.5, min:0, max:1, step:0.01}});
  musicLocation.createModule('destination1', 'tone-js/destination',       {title:'destination1', left: 1111, top: 77}, {});
  musicLocation.createModule('player1',      'tone-js/player',            {title:'player1', left: 222, top: 555}, { url: {label:'Audio URL', type: 'Input', data:"https://tonejs.github.io/audio/loop/chords.mp3"}, loop: {label:'Loop', type:'Boolean', data:true}, autostart: {label:'Autostart', type:'Boolean', data:true}, } );

  // mainLocation.createConnection('pattern1:out', 'synth1:in');
  musicLocation.createConnection('synth1:out', 'destination1:in');
  // mainLocation.createConnection('distortion1:out', 'destination1:in');
  // mainLocation.createConnection('player1:out', 'feedbackdelay1:in');
  musicLocation.createConnection('feedbackdelay1:out', 'destination1:in');

}
{
  teeLocation.createModule('input1', 'system-tools/input', {title:'Input', left: 66, top: 444}, {} );
  teeLocation.createModule('output1', 'system-tools/output', {title:'Output', left: 777, top: 444}, {});
  teeLocation.createModule('code1', 'system-tools/code', {title:'Code', left: 444, top: 444, width: 200} );

  teeLocation.createConnection('input1:out', 'code1:in');
  teeLocation.createConnection('code1:out', 'output1:in');

  // teeLocation.createModule('setting1', 'system-tools/setting', {title:'Scene Setting', left: 333, top: 222}, {} );
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
