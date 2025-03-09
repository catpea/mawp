import { Library, Component } from 'library';


class SystemTool extends Component {
  // All items from this module category inherit from this class;

  // EXAMPLE 1: external class sharing
  // import SharedClass from './SharedClass.js';
  // SharedClass = SharedClass; // give all those that inherit access to SharedClass
  // and thus ability to .xxx = new SharedClass()
  // or static classes .xxx = new SharedClass.BongoClass()
}





class Beacon extends SystemTool {
  static caption = 'Beacon';
  static description = 'Emit a number every N milliseconds.';
  static defaults = { counter: {kind: 'field', label:'Counter', type: 'Number', data:0},  milliseconds: {kind: 'field', label:'Milliseconds', type: 'Number', data:10_000, step:100, min:300},};
  static ports = {out:{side:'out', icon:'activity'}};

  initialize() {}
  start(){
    //TODO: scene start event, likley when all children of a scene report ready
    setTimeout(() => {
      // Automatically start the process
      this.execute()
    },666);
  }
  pause() {}
  resume() {}
  stop() {
    this.collectGarbage();
  }
  dispose() {}
  execute(){
    const outputPipe = this.outputPipe('out');
    if(outputPipe){
      this.settings.set('counter', 'data', this.settings.get('counter', 'data') + 1 );
      const options = { };
      const data = this.settings.get('counter', 'data');
      this.outputPipe('out').receive(data, options);
    }
    const reactivate = this.settings.get('milliseconds', 'data');
    //console.log({reactivate})
    this.setTimeout( this.execute.bind(this), reactivate);
  }
}





class Text extends SystemTool {
  static caption = 'Text';
  static description = 'Send a text packet.';
  static defaults = {
    text: {kind: 'field', label:'Text', type: 'Input', data:"My hovercraft is full of feels"},
    button: {kind: 'field', label:'Send', type: 'Button', method:'execute'},
    formal: {kind: 'field', label:'Formal', type:'Boolean', data:false}
  };
  static ports = {out:{side:'out', icon:'activity'}};

  initialize() {}
  start(){

    this.gc = this.settings.subscribe('formal', 'data', v=>
      this.settings.set('text', 'data', v?"My hovercraft is full of eels":"My hovercraft is full of feels")
    )
  }
  pause() {}
  resume() {}
  stop(){
    //console.warn('.stop()!!!!!!!!!!!!!!!!!!!!!!!');
    this.collectGarbage(); // user should call collect garbage
  }
  dispose() {}
  execute(a){
    const options = {urgent: this.settings.get('formal', 'data')};
    const data = this.settings.get('text', 'data');
    this.outputPipe('out').receive(data, options);
  }
}





class Code extends SystemTool {
  static caption = 'Code';
  static description = 'Execute a JavaScript function.';
  static defaults = { code: {kind: 'field', label:'JavaScript Code', type: 'Textarea', rows:5, data:"input.toUpperCase();"}};
  static ports = {in:{side:'in', icon:'activity'}, out:{side:'out', icon:'activity'}};

  initialize() {}
  start() {}
  pause() {}
  resume() {}
  stop() {
    this.collectGarbage();
  }
  dispose() {}

  execute({data}){
    const code = this.settings.get('code', 'data');
    let func = new Function ('input', `return ${code};`);
    const transformed = func(data);
    const options = {};
    this.outputPipe('out').receive(transformed, options);
  }
}





class Display extends SystemTool {
  static caption = 'Display';
  static description = 'Display submitted content.';
  static defaults = {text: {kind: 'field', type:'Text', title:'', subtitle:'', text: '...', subtext:''}, throw: {kind: 'field', label:'Throw', type:'Boolean', data:false}};
  static ports = {in:{side:'in', icon:'activity'}};

  initialize() {}
  start() {}
  pause() {}
  resume() {}
  stop() {
    this.collectGarbage();
  }
  dispose() {}

  execute({data}){
    if( this.settings.get('throw', 'data') ) throw Error('Throw as enabled, and I threw at you!')

    this.settings.set('text', 'text', data);
  }

}





class Input extends SystemTool {
  static caption = 'Input';
  static description = 'Receive data from the scene.';
  static defaults = { };
  static ports = {out:{side:'out', icon:'activity'}};
  initialize() {}
  start(){
    // NOTE: this should always have a single subscription to parent node
    this.disobey = this.parent.on('input', request=>this.receive(request))
  }
  pause() {}
  resume() {}
  stop(){
    this.disobey(); // Stop listening to parent
    this.collectGarbage();
  }
  dispose() {}
  receive(request){
    // NOTE: this features a normal output port
    this.outputPipe('out').receive(request.data, request.options);
  }
}





class Output extends SystemTool {
  static caption = 'Output';
  static description = 'Send data out of the scene.';
  static defaults = { };
  static ports = {in:{side:'in', icon:'activity'}};
  initialize() {}
  start() {}
  pause() {}
  resume() {}
  stop() {
    this.collectGarbage();
  }
  dispose() {}
  receive(request){
    this.parent.emit('output', request);
  }
}





class Procedure extends SystemTool {
  static caption = 'Procedure';
  static description = 'Send data through a scene.';
  static defaults = {procedure: {kind: 'field', type:'Scene', label:'Procedure', text:'Send data through another scene.', data:0}};
  static ports = {in:{side:'in', icon:'activity'}, out:{side:'out', icon:'activity'}};

  initialize() {}
  start() {}
  pause() {}
  resume() {}
  stop() {
    this.collectGarbage();
  }
  dispose() {}
  stop(){
    this.disobey();
    this.collectGarbage();
  }

  receive(request){
    const sceneName = this.settings.get('procedure', 'data');
    const scene = this.root.get('main-project', sceneName);
    scene.emit('input', request);
    // TODO: MOVE PARENT SUBSCRIPTION TO START, but avait a proper scene name
    this.disobey = scene.on('output', ({data, options})=>{
      //console.log(`Procedure receive this.parent.on 'output'`, request.data);
      this.outputPipe('out').receive(data, options)
    })
  }
}





class Note extends SystemTool {
  static caption = 'Note';
  static description = 'Leave a note on the scene.';
  static defaults = {
    text: {
      kind: 'field',
      type:'Text',
      title:'Advanced Data Processing',
      subtitle:'data integration layer',
      text: 'Add Fetch, Queue, Manager, and File System. And allow the work manager to loop data through another scene.',
      subtext:'Later: Add more form controls, insert node by dropping it on line, magnetic connection by positioning connection near a port, and minimap.'
    }
  };

  initialize() {}
  start() {}
  pause() {}
  resume() {}
  stop() {
    this.collectGarbage();
  }
  dispose() {}

}





class Fetch extends SystemTool {
  static caption = 'Fetch';
  static description = 'Leave a note on the scene.';
  static defaults = { url: {kind: 'field', label:'URL', type: 'Input', data:"package.json"} };
  static ports = {out:{side:'out', icon:'activity'}};

  initialize() {}
  start() {}
  pause() {}
  resume() {}
  stop() {
    this.collectGarbage();
  }
  dispose() {}

}





class Queue extends SystemTool {
  static caption = 'Queue';
  static description = 'Leave a note on the scene.';
  static defaults = {};
  static ports = {in:{side:'in', icon:'activity'}, out:{side:'out', icon:'activity'}};

  initialize() {}
  start() {}
  pause() {}
  resume() {}
  stop() {
    this.collectGarbage();
  }
  dispose() {}

}





class Manager extends SystemTool {
  static caption = 'Manager';
  static description = 'Leave a note on the scene.';
  static defaults = { cpusync: {kind: 'field', label:'CPU Sync', text:'Automatically adjust worker count to the number of available CPU cores.', type:'Boolean', data:true}, procedure: {kind: 'field', type:'Scene', label:'Procedure', text:'Send data through another scene.', data:1}};
  static ports = {in:{side:'in', icon:'activity'}, out:{side:'out', icon:'activity'}};

  initialize() {}
  start() {}
  pause() {}
  resume() {}
  stop() {
    this.collectGarbage();
  }
  dispose() {}

}





class Files extends SystemTool {
  static caption = 'Files';
  static description = 'Leave a note on the scene.';
  static defaults = { };
  static ports = {in:{side:'in', icon:'activity'}, out:{side:'out', icon:'activity'}};

  initialize() {}
  start() {}
  pause() {}
  resume() {}
  stop() {
    this.collectGarbage();
  }
  dispose() {}

}





class Toast extends SystemTool {

  // Identity & Configuration
  static caption = 'Toast';
  static description = 'Show a message.';
  static defaults = {};
  static ports = {in:{side:'in', icon:'activity'}};

  initialize() {}
  start() {}
  pause() {}
  resume() {}
  stop() {
    this.collectGarbage();
  }
  dispose() {}

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
  static defaults = {setting: {kind: 'field', label:'setting', type:'Setting'}};
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





export default function install(modules){

  const library = new Library('system-tools');
  library.settings.set('name', 'value', 'System Tools');
  modules.create(library);

  library.register('input', Input);
  library.register('output', Output);
  library.register('procedure', Procedure);

  library.register('beacon', Beacon);
  library.register('text', Text);

  library.register('code', Code);
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
