import Command from './Command.js';

export default class MoveWindow extends Command {

  execute({ id, left, top }) {
    console.log('MoveWindow', { id, left, top }, this.getWindow(id))
    this.getWindow(id).dataset.set("left", left);
    this.getWindow(id).dataset.set("top", top);
  }

}
