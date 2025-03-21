import { Library, Component } from 'library';

class BrowserTool extends Component {
}

class Message extends BrowserTool {
  static caption = 'Message';
  static description = 'Listen for window messages.';
  static defaults = {};
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

export default function install(){

}
