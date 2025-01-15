import Command from './Command.js';

export default class WindowDelete extends Command {

  execute({ id }) {
    this.getScene().getRelated(id).map(o=>o.remove())
    this.getScene().get(id).remove();
  }

}
