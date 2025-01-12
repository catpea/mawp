export default class Pannable {
  sceneComponent;
  targetElement;

  #startPanX = 0;
  #startPanY = 0;
  #startMousePos = { x: 0, y: 0 };
  #isPanning = false;

  constructor(sceneComponent) {
    this.sceneComponent = sceneComponent;
    // this.targetElement = sceneComponent.container;
    this.targetElement = this.sceneComponent.shadowRoot.querySelector(".content");

    // this.targetElement.style.position = 'relative';

    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onWheel = this.onWheel.bind(this);
  }

  start() {
    console.log("Pannable start!", this.targetElement);

    this.targetElement.addEventListener("wheel", this.onWheel, { passive: false, });
    this.targetElement.addEventListener("mousedown", this.onMouseDown);
    window.addEventListener("mousemove", this.onMouseMove);
    window.addEventListener("mouseup", this.onMouseUp);

    return () => this.stop();
  }

  stop() {
    this.targetElement.removeEventListener("wheel", this.onWheel, { passive: false, });
    this.targetElement.removeEventListener("mousedown", this.onMouseDown);
    window.removeEventListener("mousemove", this.onMouseMove);
    window.removeEventListener("mouseup", this.onMouseUp);
  }

  // TODO: DO THIS VIA SIGNAL SUBSCRIPTION
  updateTransform() {
    this.targetElement.style.transform = `translate(${this.sceneComponent.panX.value}px, ${this.sceneComponent.panY.value}px) scale(${this.sceneComponent.scale.value})`; //NOTE: rotateY(0deg) rotateY(0deg) prevents blurring in certain conditions
  }

  onMouseDown(event) {

    console.log("Pannable onMouseDown!", event.target);

    // if (event.target !== this.sceneComponent) return;

    // const target = event .composedPath() .find((o) => o.tagName === "BUTTON" || o === this.host);
    // if (target !== this.host) return;

    this.#isPanning = true;
    this.#startMousePos = { x: event.clientX, y: event.clientY };
    this.#startPanX = this.sceneComponent.panX.value;
    this.#startPanY = this.sceneComponent.panY.value;

    event.preventDefault();
  }

  onMouseMove(event) {

    if (this.#isPanning) {
      console.log("Pannable onMouseMove!", event.target);
      this.sceneComponent.panX.value = this.#startPanX + (event.clientX - this.#startMousePos.x);
      this.sceneComponent.panY.value = this.#startPanY + (event.clientY - this.#startMousePos.y);
      this.updateTransform();
    }
  }

  onMouseUp(event) {
    // console.log("Pannable onMouseUp!", event.target);

    this.#isPanning = false;
  }

  onWheel(event) {
    console.log("Pannable onWheel!", event.target);

    const deltaScale = event.deltaY > 0 ? 0.9 : 1.1;
    this.sceneComponent.scale.value *= deltaScale;

    const rect = this.targetElement.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;

    this.sceneComponent.panX.value = offsetX * (1 - deltaScale) + deltaScale * this.sceneComponent.panX.value;
    this.sceneComponent.panY.value = offsetY * (1 - deltaScale) + deltaScale * this.sceneComponent.panY.value;

    this.updateTransform();
    event.preventDefault();
  }
}
