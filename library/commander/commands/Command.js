export default class Command {
  project;
  constructor(project) {
    this.project = project;
  }

  getLocation(locationName=this.project.activeLocation.value) {
    const locationObject = this.project.get(locationName);
    if (!locationObject) throw new Error(`Location object "${locationName}" not found`);
    return locationObject;
  }

}
