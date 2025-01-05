export default class Command {
  project;
  constructor(project) {
    this.project = project;
  }

  getWindow(id) {
    return this.project.activeScene.getWindow(id);
  }

}
