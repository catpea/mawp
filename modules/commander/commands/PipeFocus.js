import Command from './Command.js';

export default class PipeFocus extends Command {

  execute({ id }) {
    this.getLocation().get(id).settings.setValue('active', true);
  }

}
