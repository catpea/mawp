export default class Command {
  application;
  constructor(application) {
    this.application = application;
  }

  getLocation(locationName=this.application.activeLocation.value) {
    const locationObject = this.application.get('main-project', locationName);
    if (!locationObject) throw new Error(`Location object "${locationName}" not found`);
    return locationObject;
  }

}
