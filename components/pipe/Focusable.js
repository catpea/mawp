export default class Focusable {

  constructor(pipeComponent, focusableLine) {
    this.pipeComponent = pipeComponent;
    this.focusableLine = focusableLine;

    this.mouseDownHandler = this.mouseDownHandler.bind(this);
  }

  start() {
    this.focusableLine.addEventListener('mousedown', this.mouseDownHandler);
    return () => this.stop();
  }

  stop() {
    this.focusableLine.removeEventListener('mousedown', this.mouseDownHandler);
  }

  mouseDownHandler(event) {
    this.pipeComponent.scene.setFocus(this.pipeComponent);
  }

}
