import Command from './Command.js';

export default class SceneSelect extends Command {

  execute({ id }) {
    this.project.activeLocation.value = id;
  }

}
