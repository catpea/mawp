import Command from './Command.js';

export default class PipeFocus extends Command {

  execute({ id }) {
    this.getScene().getPipe(id).dataset.set('active', true);
  }

}
