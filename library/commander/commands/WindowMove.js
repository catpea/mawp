import Command from './Command.js';

export default class WindowMove extends Command {

  execute({ id, left, top }) {
    this.getWindow(id).dataset.set("left", left);
    this.getWindow(id).dataset.set("top", top);
  }

}
