import guid from 'guid';
import Command from './Command.js';

// windowCreate -id a
export default class WindowCreate extends Command {

  async execute({ id=guid(), path, configuration=null, title=null, reference=null, top=null, left=null, style, active=false, agent='@core/standard-agent' }) {

    const component = this.getLocation().createModule(id, path, {title, left, top}, configuration);
    await component.state.initialize(); //NOTE: newly created components must be initialized
    await component.state.start(); //NOTE: newly created components must be started

  }

}
