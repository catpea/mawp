import Command from './Command.js';

export default class WindowMove extends Command {

  execute({ id, left, top }) {
    const component = this.getLocation().get(id);
    if(!component) return;
    component.settings.set('left', 'value', left);
    component.settings.set('top', 'value', top);
  }

}
