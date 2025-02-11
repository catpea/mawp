import { Library, Component } from 'library';


class SystemTool extends Component {
  // All items from this module category inherit from this class;

  // EXAMPLE 1: external class sharing
  // import SharedClass from './SharedClass.js';
  // SharedClass = SharedClass; // give all those that inherit access to SharedClass
  // and thus ability to .xxx = new SharedClass()
  // or static classes .xxx = new SharedClass.BongoClass()
}


class Note extends SystemTool {
  static caption = 'Note';
  static description = 'Leave a note on the scene.';
  static defaults = { };
}

class Fetch extends SystemTool {
  static caption = 'Fetch';
  static description = 'Leave a note on the scene.';
  static defaults = { };
  static ports = {out:{side:'out', icon:'activity'}};
}

class Queue extends SystemTool {
  static caption = 'Queue';
  static description = 'Leave a note on the scene.';
  static defaults = {};
  static ports = {in:{side:'in', icon:'activity'}, out:{side:'out', icon:'activity'}};
}

class Manager extends SystemTool {
  static caption = 'Manager';
  static description = 'Leave a note on the scene.';
  static defaults = { cpusync: {label:'CPU Sync', text:'Automatically adjust worker count to the number of available CPU cores.', type:'Boolean', data:true}, setting: {type:'Scene', label:'Transformer', text:'Transformer will only list scenes with "Scene Input" and "Scene Output" blocks. Allowing for _transformation_ of data.'}};
  static ports = {in:{side:'in', icon:'activity'}, out:{side:'out', icon:'activity'}};

  /*
   Phrasing
      "Match worker count to CPU cores"
      "Auto-assign workers based on CPU count"
      "Set worker threads to CPU core count"
      "Use CPU core count for worker processes"
      "Automatically adjust workers to CPU cores"
      "Synchronize workers with system CPUs"
      "Optimize worker count for system CPUs"
      "Align worker count with CPU cores"
      "Use all available CPU cores for workers"
      "Distribute workers across CPU cores"
      "Utilize CPU cores for worker allocation"
      "Configure workers based on CPU availability"
      "Adapt worker count to system processors"
      "Enable CPU-based worker distribution"
      "Maximize workers by using CPU cores"
  */
}

class Files extends SystemTool {
  static caption = 'Files';
  static description = 'Leave a note on the scene.';
  static defaults = { };
  static ports = {in:{side:'in', icon:'activity'}, out:{side:'out', icon:'activity'}};
}



class Toast extends SystemTool {

  // Identity & Configuration
  static caption = 'Toast';
  static description = 'Show a message.';
  static defaults = {};

  // Lifecycle (initialize, start, pause, stop, resume, dispose)

  initialize(){
     this.channels.set('text', {side:'in', icon:'activity'});
  }

  send(){}
  receive(){}

  execute(){}
  upgrade(){}

  connectable(){}
  connect(){}
  disconnect(){}

}




class Setting extends SystemTool {
  static caption = 'Setting';
  static description = 'Monitor a scene setting, and pass the value along if it changes.';
  static defaults = {setting: {label:'setting', type:'Setting'}};
  static ports = {out:{side:'out', icon:'activity'}};

  initialize(){
  }

  start(){}

  // am I connectable to destination
  connectable(req){return true;}

  connect(){}

  execute(){}

  disconnect(){}

  dispose(){}


}




export default function install(){

  const library = new Library('system-tools');
  library.settings.name = 'Scene Tools';

  library.register('note',    Note);
  library.register('fetch',   Fetch);
  library.register('queue',   Queue);
  library.register('manager', Manager);
  library.register('files',   Files);
  library.register('toast',   Toast);
  library.register('setting', Setting);

  return library;

}
