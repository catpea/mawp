import Command from './Command.js';

export default class WindowMove extends Command {

  execute({ id, left, top }) {
    this.getLocation().get(id).dataset.set("left", left);
    this.getLocation().get(id).dataset.set("top", top);
  }

}
