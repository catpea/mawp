import Command from './Command.js';

export default class WindowFocus extends Command {

  execute({ id }) {
    this.getScene().getWindow(id).dataset.set('active', true);
  }

}
