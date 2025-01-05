export default class Command {
  project;
  constructor(project) {
    this.project = project;
  }

  getWindow(id) {
    const sceneName = this.project.activeScene.value;
    const sceneObject = this.project.get(sceneName);
    if (!sceneObject) throw new Error(`Scene object "${sceneName}" not found`);
    const windowObject = sceneObject.getWindow(id);
    if (!windowObject) throw new Error(`Window object "${id}" not found`);
    return windowObject;
  }

}
