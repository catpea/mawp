export default class Command {
  project;
  constructor(project) {
    this.project = project;
  }

  getWindow(id) {
    console.log('this.project.activeScene', this.project.activeScene);

    return this.project.activeScene.getWindow(id);

  }

}
