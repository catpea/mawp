import { Library, Component } from 'library';


class SceneComponent extends Component {
  // All items from this module category inherit from this class;

  // EXAMPLE 1: external class sharing
  // import SharedClass from './SharedClass.js';
  // SharedClass = SharedClass; // give all those that inherit access to SharedClass
  // and thus ability to .xxx = new SharedClass()
  // or static classes .xxx = new SharedClass.BongoClass()
}


class SceneNoteComponent extends SceneComponent {
  static caption = 'Note';
  static description = 'Leave a note on the scene.';
  static defaults = {text:{label:'Message', type:'Text', data: 'Preparing to add more building blocks.'}};
}

class SceneToastComponent extends SceneComponent {

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

class SceneSettingComponent extends SceneComponent {
  static caption = 'Scene Setting';
  static description = 'Monitor a scene setting, and pass the value along if it changes.';
  static defaults = {};

  initialize(){
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




export default function install(){

  const library = new Library('scene-tools');
  library.settings.name = 'Scene Tools';

  library.register('note',   SceneNoteComponent);
  library.register('toast',   SceneToastComponent);
  library.register('setting', SceneSettingComponent);

  return library;

}
