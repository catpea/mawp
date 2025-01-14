export default class Command {
  project;
  constructor(project) {
    this.project = project;
  }

  getScene(sceneName=this.project.activeScene.value) {
    const sceneObject = this.project.get(sceneName);
    if (!sceneObject) throw new Error(`Scene object "${sceneName}" not found`);
    return sceneObject;
  }

}
