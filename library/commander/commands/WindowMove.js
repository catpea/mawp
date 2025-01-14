import Command from './Command.js';

export default class WindowMove extends Command {

  execute({ id, left, top }) {
    this.getScene().getWindow(id).dataset.set("left", left);
    this.getScene().getWindow(id).dataset.set("top", top);
  }

}
