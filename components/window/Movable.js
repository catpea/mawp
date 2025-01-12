// updated screen to client
export default class Movable {
  windowComponent;
  cardElement;
  dragHandle;

  #dragging = false;
  #previousX = 0;
  #previousY = 0;

  finalCoordinate; // log the final command

  constructor(windowComponent) {
    this.windowComponent = windowComponent;

    this.cardElement = this.windowComponent.shadowRoot.querySelector(".card");
    this.dragHandle = this.cardElement.querySelector(".card-header");

    this.mouseDownHandler = this.mouseDownHandler.bind(this);
    this.mouseMoveHandler = this.mouseMoveHandler.bind(this);
    this.mouseUpHandler = this.mouseUpHandler.bind(this);
  }

  start() {
    const position = window.getComputedStyle(this.cardElement).position;
    if (!position === "absolute") this.cardElement.style.position = "absolute"; // Ensure the element is absolutely positioned

    this.dragHandle.addEventListener("mousedown", this.mouseDownHandler),

    document.addEventListener("mouseup", this.mouseUpHandler);
    return () => this.stop();
  }

  stop() {
    this.dragHandle.forEach((el) =>
      el.removeEventListener("mousedown", this.mouseDownHandler),
    );
    document.removeEventListener("mouseup", this.mouseUpHandler);
    document.removeEventListener("mousemove", this.mouseMoveHandler);
  }

  mouseDownHandler(event) {
    // event.stopPropagation(); // Prevents the event from bubbling up the DOM tree, preventing any parent handlers from being notified of the event.
    event.preventDefault(); // Prevent prevent the default behavior - default action should not be taken as it normally would be.

    this.#dragging = true;

    // Initialize previousN
    // NOTE: a sister call must be made at the end of mouseMoveHandler
    this.#previousX = event.clientX;
    this.#previousY = event.clientY;

    document.addEventListener("mousemove", this.mouseMoveHandler);
  }

  mouseMoveHandler(event) {
    event.stopPropagation();
    event.preventDefault();

    if (this.#dragging) {

      // Calculate Relative Delta
      // NOTE: this depends on "Update previousN" and we just substract to get a -n or +n from the last few dozen miliseconds
      let deltaX = this.#previousX - event.clientX;
      let deltaY = this.#previousY - event.clientY;

      // Apply scale transformation if any to delta (which uses screen pixels)
      // NOTE: deltaN calculations use screenN which is an untransformed pixel, but we maybe zoomed in/out so we account for that.
      const scale = this.cardElement.getBoundingClientRect().width / this.cardElement.offsetWidth;
      deltaX = deltaX / scale;
      deltaY = deltaY / scale;

      // RARE: if there is no style set, initialize values
      if (this.cardElement.style.left === "") this.cardElement.style.left = this.cardElement.offsetLeft + "px";
      if (this.cardElement.style.top === "") this.cardElement.style.top = this.cardElement.offsetTop + "px";

      // Apply the delta to element being dragged
      // NOTE: we are only adding the updated delta to existing x and y - think of it as matching the motion that the cursor made since the last sampling of previousN
      let x = parseFloat(this.cardElement.style.left) - deltaX;
      let y = parseFloat(this.cardElement.style.top) - deltaY;

      // Apply the updated x and y to the element
      // NOTE: x and y are updated by the scaled delta
      // TODO: should only assign to attribute
      this.cardElement.style.left = `${x}px`;
      this.cardElement.style.top = `${y}px`;

      // this.windowComponent.source.dataset.set("left", x);
      // this.windowComponent.source.dataset.set("top", y);

      this.finalCoordinate = { id: this.windowComponent.id, left: x, top: y };

      // WARN: you must use floating point numbers, otherwise motion is inaccurate
      this.windowComponent.project.commander.windowMove(
        { id: this.windowComponent.id, left: x, top: y }
      );

      // Update previousN - get ready for next update
      this.#previousX = event.clientX;
      this.#previousY = event.clientY;
    }
  }

  mouseUpHandler(event) {

    this.#dragging = false;
    document.removeEventListener("mousemove", this.mouseMoveHandler);
  }
}
