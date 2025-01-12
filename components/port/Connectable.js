export default class Connectable {
  // element;
  // system;
  //
  portComponent;

  #dragging = false;

  #lines = [];
  #lineStrokes = ['var(--bs-primary)', 'var(--bs-info)'];
  #lineWidths = [5,3];

  #previousX = 0;
  #previousY = 0;

  #rawX = 0;
  #rawY = 0;

  #finalX = 0;
  #finalY = 0;

  #touchdownOffsetX;
  #touchdownOffsetY;

  constructor(portComponent) {
    this.portComponent = portComponent;
    // this.portComponent.scene.drawingSurfaces

    this.portComponentXXX = portComponent;
    console.log('VVV YAH')
    // this.xElement = this.portComponent.shadowRoot.querySelector("...");
    // this.xHandle = this.xElement.querySelectorAll("...");
      // this.windowComponent.project.commander.windowMove(
      //   { id: this.windowComponent.id, left: x, top: y }
      // );
    this.mouseDownHandler = this.mouseDownHandler.bind(this);
    this.mouseMoveHandler = this.mouseMoveHandler.bind(this);
    this.mouseUpHandler = this.mouseUpHandler.bind(this);
    this.getCoordinates = this.getIconCoordinates.bind(this);

  }

  start() {
    this.portComponentXXX.addEventListener('mousedown', this.mouseDownHandler);
    document.addEventListener('mouseup', this.mouseUpHandler);
    return () => this.stop();
  }

  stop() {
    this.portComponentXXX.removeEventListener('mousedown', this.mouseDownHandler);
    document.removeEventListener('mouseup', this.mouseUpHandler);
    document.removeEventListener('mousemove', this.mouseMoveHandler);
  }




  // TODO: create x and y transform funcion, rather than this mess
  getIconCoordinates(){
    console.log('Coordinates of' , this.portComponentXXX);

    const scale = this.portComponent.scene.zoom;

    let {x:elementX,y:elementY, width:elementW, height:elementH} = this.portComponentXXX.getDecal().getBoundingClientRect();

    elementX = elementX / scale;
    elementY = elementY / scale;
    elementW = elementW / scale;
    elementH = elementH / scale;

    // center of element
    const centerW = elementW/2;
    const centerH = elementH/2;

    let centeredX = elementX + centerW;
    let centeredY = elementY + centerH;

    let {x:panX,y:panY} = this.portComponent.scene.pan;

    panX = panX / scale;
    panY = panY / scale;

    centeredX = centeredX - panX;
    centeredY = centeredY - panY;

    return [centeredX, centeredY];
  }

  mouseDownHandler(event) {
    event.stopPropagation(); // Prevents the event from bubbling up the DOM tree, preventing any parent handlers from being notified of the event.
    event.preventDefault(); // Prevent prevent the default behavior - default action should not be taken as it normally would be.

    this.#dragging = true;



    // WHERE IN THE PORT THE CLICK WAS MADE
    this.#touchdownOffsetX = event.offsetX;
    this.#touchdownOffsetY = event.offsetY;

    let [x1, y1] = this.getIconCoordinates();

    for (const [sceneIndex, svgSurface] of Object.entries(this.portComponent.scene.drawingSurfaces)) {
      const svgLline = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      svgLline.setAttribute('stroke',  this.#lineStrokes[sceneIndex]);
      svgLline.setAttribute('stroke-width', this.#lineWidths[sceneIndex]);
      svgLline.setAttribute('x1', x1);
      svgLline.setAttribute('y1', y1);
      svgLline.setAttribute('x2', x1); // set to zero point, to prevent a "flash of white"
      svgLline.setAttribute('y2', y1); // set to zero point, to prevent a "flash of white"
      svgSurface.appendChild(svgLline);
      this.#lines.push(svgLline); // for removal after operation is done
    }

    // Initialize previousN
    // NOTE: a sister call must be made at the end of mouseMoveHandler
    this.#previousX = event.clientX;
    this.#previousY = event.clientY;

    document.addEventListener('mousemove', this.mouseMoveHandler);

  }

  transform(x,y){

  }

  mouseMoveHandler(event) {

    event.stopPropagation();
    event.preventDefault();

    if (this.#dragging) {

    // Calculate Relative Delta
    // NOTE: this depends on "Update previousN" and we just substract to get a -n or +n from the last few dozen miliseconds
    let deltaX = (this.#previousX - event.clientX);
    let deltaY = (this.#previousY - event.clientY);

    // MouseEvent: clientN property provides the N coordinate within the application's viewport at which the event occurred
    let currentX = event.clientX;
    let currentY = event.clientY;

    this.#lines.forEach(line=>{
      line.setAttribute('x2', currentX); // initially a point
      line.setAttribute('y2', currentY); // initially a point
    })

    // Update previousN - get ready for next update
    this.#previousX = event.clientX;
    this.#previousY = event.clientY;

    }

  }

  mouseUpHandler(event) {
    document.removeEventListener('mousemove', this.mouseMoveHandler);

    if (this.#dragging){
      this.#dragging = false;

      this.#lines.forEach(line=>line.remove());

      // NOTE: using element.id, not dataset or cutom property
      const fromActor = this.portComponent.window;
      const fromValve = this.portComponent;
      const from = [fromActor.id, fromValve.id.replace(/^port-/,'')].join(':');
      console.log({from});

      if (!fromActor) {
        // did not drag to anything
        return;
      }
      const composedPath = event.composedPath().filter(el=>el instanceof HTMLElement).filter(el=>el.hasAttribute('id'))
      console.log('composedPath', composedPath);

      const toActor = composedPath.find(el=>el.matches(`x-window`))
      if (!toActor) {
        // did not drag to anything
        return;
      }
      const toValve = composedPath.find(el=>el.matches(`x-port`))

      if (!toValve) {
        // did not detect a vale in the composed path.
        return;
      }
      const to = [toActor.id, toValve.id.replace(/^port-/,'')].join(':');
      console.log({to});





      // const cable = document.createElement(`${VPL_ELEMENT_PREFIX}-cable`);
      // cable.setAttribute('id', this.system.guid());
      // cable.setAttribute('from', from);
      // cable.setAttribute('to', to);
      // this.system.getStage().appendChild(cable);

      this.portComponent.application.project.commander.pipeCreate({from, to});



    }


  }

}
