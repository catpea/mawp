import Command from './Command.js';

export default class WindowDelete extends Command {

  execute({ id }) {
    this.getLocation().getRelated(id).map(o=>o.remove())
    this.getLocation().get(id).remove();
  }

}
