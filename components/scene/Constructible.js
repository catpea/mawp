export default class Constructible {
  sceneComponent;
  targetElement;

  svgMarkerDot;

  #mouseCoordinates = { x: 0, y: 0 };

  constructor(sceneComponent) {
    this.sceneComponent = sceneComponent;
    this.targetElement = this.sceneComponent.shadowRoot.querySelector(".content");

    this.onContextMenu = this.onContextMenu.bind(this);
  }

  start() {
    this.sceneComponent.addEventListener("contextmenu", this.onContextMenu);
    return () => this.stop();
  }

  stop() {
    this.targetElement.removeEventListener("contextmenu", this.onContextMenu);
  }

  onContextMenu(event) {
    event.preventDefault();
    const [x,y] = this.sceneComponent.transform(event.clientX, event.clientY);
    this.#mouseCoordinates = {x, y};
    console.log(event, this.#mouseCoordinates );

     const svgSurface = this.sceneComponent.drawingSurfaces[1];
     if(!this.svgMarkerDot) this.svgMarkerDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
     this.svgMarkerDot.setAttribute('r',  32);
     this.svgMarkerDot.setAttribute('fill', 'rgba(255,0,0,0.3)');
     this.svgMarkerDot.setAttribute('cx', x);
     this.svgMarkerDot.setAttribute('cy', y);
     svgSurface.appendChild(this.svgMarkerDot);
     setTimeout(()=>{this.svgMarkerDot.remove(); this.svgMarkerDot = null;}, 300)

  }

}
