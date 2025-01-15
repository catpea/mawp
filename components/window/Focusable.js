export default class Focusable {

  constructor(windowComponent) {
    this.windowComponent = windowComponent;
    this.cardElement = this.windowComponent.shadowRoot.querySelector(".card");
    this.mouseDownHandler = this.mouseDownHandler.bind(this);
  }

  start() {
    this.cardElement.addEventListener('mousedown', this.mouseDownHandler);
    return () => this.stop();
  }

  stop() {
    this.cardElement.removeEventListener('mousedown', this.mouseDownHandler);
  }

  mouseDownHandler(event) {
    this.windowComponent.scene.setFocus(this.windowComponent);
  }

}
