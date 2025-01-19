import Command from './Command.js';

export default class WindowMove extends Command {

  execute({ id, left, top }) {
    const win = this.getLocation().get(id);
    if(!win) return;
    win.dataset.set("left", left);
    win.dataset.set("top", top);
  }

}
