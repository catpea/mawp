import { Library, Component } from 'library';


class SystemTool extends Component {
  // All items from this module category inherit from this class;

  // EXAMPLE 1: external class sharing
  // import SharedClass from './SharedClass.js';
  // SharedClass = SharedClass; // give all those that inherit access to SharedClass
  // and thus ability to .xxx = new SharedClass()
  // or static classes .xxx = new SharedClass.BongoClass()
}





class Text extends SystemTool {
  static caption = 'Text';
  static description = 'Send a text packet.';
  static defaults = { text: {label:'Text', type: 'Input', data:"My hovercraft is full of eels"}, button: {label:'Send', type: 'Button', method:'execute'}, urgent: {label:'Urgent', type:'Boolean', data:true}};
  static ports = {out:{side:'out', icon:'activity'}};

  execute(a){
    const options = {urgent: this.settings.get('urgent').data.value};
    const data = this.settings.get('text').data.value;
    this.outputPipe('out').receive(data, options);
  }

}

class Code extends SystemTool {
  static caption = 'Code';
  static description = 'Execute a JavaScript function.';
  static defaults = { code: {label:'JavaScript Code', type: 'Textarea', rows:5, data:"input.toUpperCase();"}};
  static ports = {in:{side:'in', icon:'activity'}, out:{side:'out', icon:'activity'}};

  execute(port, data, source, setup){
    const code = this.settings.get('code').data.value;
    console.info(`Code receive data`,  data);
    console.info(`Code code is`, code);

    let func = new Function ('input', `return ${code};`);


    const transformed = func(data);

    const options = {};
    this.outputPipe('out').receive(transformed, options);
  }


}
class Display extends SystemTool {
  static caption = 'Display';
  static description = 'Display submitted content.';
  static defaults = {text: {type:'Text', title:'', subtitle:'', text: '...', subtext:''}};
  static ports = {in:{side:'in', icon:'activity'}};
  receive(request){
    console.info(`Display receive request data`, request.data);

    this.settings.get('text').text.value =   request.data;
  }
}

class Input extends SystemTool {
  static caption = 'Input';
  static description = 'Receive data from the scene.';
  static defaults = { };
  static ports = {out:{side:'out', icon:'activity'}};
  receive(request){
    console.log(`Input receive data`, request.data);
    this.outputPipe('out').receive(request.data, request.options);

  }
  start(){
    this.parentUnSubscription = this.parent.on('input', request=>this.receive(request))
  }
  stop(){
    this.parentUnSubscription();
  }
}
class Output extends SystemTool {
  static caption = 'Output';
  static description = 'Send data out of the scene.';
  static defaults = { };
  static ports = {in:{side:'in', icon:'activity'}};
  receive(request){
    console.log(`Output receive request data`, request.data);
    this.parent.emit('output', request);
  }
}
class Procedure extends SystemTool {
  static caption = 'Procedure';
  static description = 'Send data through a scene.';
  static defaults = {procedure: {type:'Scene', label:'Procedure', text:'Send data through another scene.', data:0}};
  static ports = {in:{side:'in', icon:'activity'}, out:{side:'out', icon:'activity'}};

  receive(request){
    const sceneName = this.settings.get('procedure').data.value;
    const scene = this.root.get('main-project', sceneName);
    scene.emit('input', request);


    // TODO: MOVE PARENT SUBSCRIPTION TO START, but avait a proper scene name
    this.parentUnSubscription = scene.on('output', ({data, options})=>{
      console.log(`Procedure receive this.parent.on 'output'`, request.data);

      this.outputPipe('out').receive(data, options)
    })
  }
  start(){

    // const sceneName = this.settings.get('procedure').data.value;
    // const scene = this.root.get('main-project', sceneName);


  }
  stop(){
    this.parentUnSubscription();
  }
}







class Note extends SystemTool {
  static caption = 'Note';
  static description = 'Leave a note on the scene.';
  static defaults = {text: {type:'Text', title:'Advanced Data Processing', subtitle:'data integration layer', text: 'Add Fetch, Queue, Manager, and File System. And allow the work manager to loop data through another scene.', subtext:'Later: Add more form controls, insert node by dropping it on line, magnetic connection by positioning connection near a port, and minimap.'}};
}

class Fetch extends SystemTool {
  static caption = 'Fetch';
  static description = 'Leave a note on the scene.';
  static defaults = { url: {label:'URL', type: 'Input', data:"package.json"} };
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
  static defaults = { cpusync: {label:'CPU Sync', text:'Automatically adjust worker count to the number of available CPU cores.', type:'Boolean', data:true}, procedure: {type:'Scene', label:'Procedure', text:'Send data through another scene.', data:1}};
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
  library.settings.name = 'System Tools';

  library.register('input', Input);
  library.register('output', Output);
  library.register('procedure', Procedure);
  library.register('code', Code);
  library.register('text', Text);
  library.register('display', Display);

  library.register('note',    Note);
  library.register('fetch',   Fetch);
  library.register('queue',   Queue);
  library.register('manager', Manager);
  library.register('files',   Files);
  library.register('toast',   Toast);
  library.register('setting', Setting);

  return library;

}
