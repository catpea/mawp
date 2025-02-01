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
    //console.log("Pannable start!", this.targetElement);

    this.sceneComponent.addEventListener("wheel", this.onWheel, { passive: false, });
    this.sceneComponent.addEventListener("mousedown", this.onMouseDown);
    window.addEventListener("mousemove", this.onMouseMove);
    window.addEventListener("mouseup", this.onMouseUp);

    this.updateTransform();
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

    //console.log("Pannable onMouseDown!", event.target);

    if (event.originalTarget !== this.sceneComponent) return;

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
      this.sceneComponent.panX.value = this.#startPanX + (event.clientX - this.#startMousePos.x);
      this.sceneComponent.panY.value = this.#startPanY + (event.clientY - this.#startMousePos.y);
      this.updateTransform();
    }
  }

  onMouseUp(event) {
    this.#isPanning = false;
  }

  onWheel(event) {
    console.log("Pannable onWheel Target", event.originalTarget.tagName, event.target.tagName);

    let allow = true;
    if (event.originalTarget !== this.sceneComponent) allow = false;
    if (event.target.tagName == 'X-WINDOW') allow = true; // overturn verdict;
    if (event.originalTarget.tagName == 'line') allow = true; // overturn verdict;
    if(!allow) return;

    const deltaScale = event.deltaY > 0 ? 0.9 : 1.1;
    this.sceneComponent.scale.value *= deltaScale;

    // IMPORTANT: offsetX and offsetY must be calculated based on the sceneComponent AND NOT targetElement
    const rect = this.sceneComponent.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;

    this.sceneComponent.panX.value = offsetX * (1 - deltaScale) + deltaScale * this.sceneComponent.panX.value;
    this.sceneComponent.panY.value = offsetY * (1 - deltaScale) + deltaScale * this.sceneComponent.panY.value;

    this.updateTransform();
    event.preventDefault();
  }
}
