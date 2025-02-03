import Signal from "signal";
import lol from "lol";

import Pannable from "./Pannable.js";
import Constructible from "./Constructible.js";
import Switchable from "./Switchable.js";

export default class Scene extends HTMLElement {

  active = new Signal(false);

  mouseX = new Signal(0);
  mouseY = new Signal(0);

  panX = new Signal(0);
  panY = new Signal(0);
  scale = new Signal(1);

  constructor() {
    super();
    const localStyle = `

      :host {
        display: block;
        overflow: hidden;
        position: relative;
        touch-action: none;
        user-select: none;

        /* dimensions set programatically */
        height: 100vh;
      }

        .content {
          transform-origin: 0 0;
          height: 100%;
        }



        .pattern-background {
          // border-radius: 16px 0 0 0;
          background-color: var(--bs-body-bg);
          pointer-events: none;

          position: absolute;
          width: 100%;
          height: 100%;

          overflow: visible; /* does not cut off the lines when dragging outside into minus space */

          .illustration-dot {
          fill: var(--bs-border-color)
          }

        }

        .illustration {
          pointer-events: none;

          position: absolute;
          width: 100%;
          height: 100%;

          overflow: visible; /* does not cut off the lines when dragging outside into minus space */

          &.illustration-foreground {
            z-index: 2642657228;
            background-color: transparent;
          }
        }

      `;
    const localCss = new CSSStyleSheet();
    localCss.replaceSync(localStyle.trim());

    this.status = new Signal("loading");

    const shadow = this.attachShadow({ mode: "open" });

    shadow.adoptedStyleSheets = [...document.adoptedStyleSheets, localCss];

    this.container = document.createElement("div");


    this.container.innerHTML = `
        <svg class="pattern-background">
          <defs>
            <pattern id="graph-pattern" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle class="illustration-dot" r="1" cx="2.2" cy="2.2"></circle>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#graph-pattern)" opacity="0.5"></rect>
        </svg>

        <div class="content">
          <svg class="illustration illustration-background"></svg>
          <slot></slot>
          <svg class="illustration illustration-foreground"></svg>
        </div>

        <x-toolbar></x-toolbar>

        <!--
          <x-prompt></x-prompt>
          <x-console></x-console>
        -->

        <span class="position-absolute top-0 start-50 opacity-25">
          mouse=<small name="debug-mouseX">?</small>x<small name="debug-mouseY">?</small> pan=<small name="debug-panX">?</small>x<small name="debug-panY">?</small> scale=<small name="debug-scale">?</small> active=<small name="debug-active"></small>
        </span>

    `;

    shadow.appendChild(this.container);



  }

  // fires after the element has been attached to the DOM
  connectedCallback() {

    const pannable = new Pannable(this);
    this.gc = pannable.start();

    const constructible = new Constructible(this);
    this.gc = constructible.start();

    const switchable = new Switchable(this);
    this.gc = switchable.start();

    this.mouseX.subscribe(v => this.container.querySelector('[name="debug-mouseX"]').textContent = Number.parseFloat(v).toFixed(0));
    this.mouseY.subscribe(v => this.container.querySelector('[name="debug-mouseY"]').textContent = Number.parseFloat(v).toFixed(0));

    this.panX.subscribe(v => this.container.querySelector('[name="debug-panX"]').textContent = Number.parseFloat(v).toFixed(0));
    this.panY.subscribe(v => this.container.querySelector('[name="debug-panY"]').textContent = Number.parseFloat(v).toFixed(0));
    this.scale.subscribe(v => this.container.querySelector('[name="debug-scale"]').textContent = Number.parseFloat(v).toFixed(2));
    this.active.subscribe(v => this.container.querySelector('[name="debug-active"]').textContent = v);


      const contentMouseElement = this;
      const mouseTracker = (event) => {
        const [x,y] = this.transform(event.offsetX, event.offsetY);
        this.mouseX.value = x;
        this.mouseY.value = y;
      }
      contentMouseElement.addEventListener("mousemove", mouseTracker);
      this.gc = () => contentMouseElement.removeEventListener("mousemove", mouseTracker);



    this.status.value = "ready";

    let useForceHeight = false;
    if(useForceHeight){
      // Force Fill To The Screen Height - POC;
      window.addEventListener('resize', this.adjustNestedElementHeight.bind(this));
      window.addEventListener('load', this.adjustNestedElementHeight.bind(this));
      this.adjustNestedElementHeight();
    }

    this.addEventListener("mousedown", this.clearFocusHandler.bind(this));
    this.gc = () => this.removeEventListener("mousedown", this.clearFocusHandler.bind(this));
  }

  adjustNestedElementHeight() {
    let viewportHeight = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
    const sceneTop = this.getBoundingClientRect().top;
    const availableHeight = viewportHeight - sceneTop;
    this.style.height = `${availableHeight}px`;
  }




  // componentDelete(id){
  //   this.application.project.commander.windowDelete({id:this.id});
  //   this.scene.clearFocus();
  // }

   clearFocusHandler(){
     if (event.originalTarget === this) this.clearFocus()
   }
   clearFocus(){
    const childGroup = Array.from(this.children)
    this.active.value = false;
    childGroup.filter(o=>o.dataset.active != 'false').map(o=>o.dataset.active = 'false');
   }



   setFocus(sceneElement){
     // console.log('setFocus', sceneElement.id);

    const childGroup = Array.from(this.children)

    // Normalizing z-index: It ensures that any elements without a defined z-index are assigned one based on their order.
    for (const [index, win] of childGroup.entries()) {
      if(win.dataset.zindex === undefined) win.dataset.zindex=index;
    }

    // Finding the Topmost z-index: It calculates the maximum z-index among the children to determine the next available z-index.
    let newTopmost = Math.max( ...childGroup.map(o=>parseInt(o.dataset.zindex)) ) + 1;
    sceneElement.dataset.zindex = newTopmost;

    childGroup.filter(o=>o.id !== sceneElement.id).filter(o=>o.dataset.active != 'false').map(o=>o.dataset.active = 'false');
    if(sceneElement.dataset.active != 'true') sceneElement.dataset.active = 'true';
    this.active.value = sceneElement.id;

    // Reindexing: Finally, it sorts the children by their z-index and applies a zero-based numbering scheme.
    for (const [index, win] of [...childGroup].sort((a,b)=>parseInt(a.dataset.zindex) - parseInt(b.dataset.zindex) ).entries()) {
      const oldValue = parseInt(win.dataset.zindex);
      const newValue = index;
      if(oldValue !== newValue){
        win.dataset.zindex = newValue;
      }
    }
    // console.dir(childGroup.map(o=>[o.id, o.dataset.zindex]));

  }






  // QUESTIONABLE BUT USEFUL UTILITY FUNCTIONS

  get toolbar() {
    return this.shadowRoot.querySelector("x-toolbar");
  }


  get drawingSurfaces() {
    return this.shadowRoot.querySelectorAll("svg.illustration");
  }

  getElementById(id) {
    const response = this.querySelector(`[id=${id}]`);
    return response;
  }



  getWindow(colonAddress) {
    const [elementId, portId] = colonAddress.split(/:/, 2);
    // console.log('getWindow', elementId, portId)
    const element = this.getElementById(elementId);
    return element;
  }

  getPort(colonAddress) {
    const [elementId, portId] = colonAddress.split(/:/, 2);
    const element = this.getElementById(elementId);
    const port = element.getPortElement(portId);
    return port;
  }

  getDecal(colonAddress) {
    const [elementId, portId] = colonAddress.split(/:/, 2);
    const element = this.getElementById(elementId);
    if (!element) {
      throw new Error(`Element ${elementId} not found`);
    }

    const port = element.getPortElement(portId);
    if (!port) throw new Error(`Failed to locate port (${portId})`);
    const decal = port.getDecal();
    return decal;
  }


  getCenterDropCoordinates(){
    let {
      width,
      height,
    } = this.getBoundingClientRect();

    let scale = this.scale.value;
    let panX = this.panX.value;
    let panY = this.panY.value;

    panX = panX / scale;
    panY = panY / scale;

    width = width / scale;
    height = height / scale;

    let x = (width/2) + (-panX);
    let y = (height/2) + (-panY);


    // x = x - this.getBoundingClientRect().left;


    return [x,y];
  }

  calculateCentralCoordinatesOld(el) {
    // let {x:sceneX,y:sceneY, width:sceneW, height:sceneH} = this.getBoundingClientRect();

    let {
      x: elementX,
      y: elementY,
      width: elementW,
      height: elementH,
    } = el.getBoundingClientRect();

    const scrollLeft = window.scrollX;
    const scrollTop = window.scrollY;

    elementX = elementX + scrollLeft;
    elementY = elementY + scrollTop;

    let panX = this.panX.value;
    let panY = this.panY.value;
    let zoom = this.scale.value;

    elementX = elementX / zoom;
    elementY = elementY / zoom;

    elementW = elementW / zoom;
    elementH = elementH / zoom;

    const centerW = elementW / 2;
    const centerH = elementH / 2;

    panX = panX / zoom;
    panY = panY / zoom;

    const positionedX = elementX - panX;
    const positionedY = elementY - panY;

    const centeredX = positionedX + centerW;
    const centeredY = positionedY + centerH;

    return [centeredX, centeredY];
  }



  calculateCentralCoordinates(el) {

    let {
      x: elementX,
      y: elementY,
      width: elementW,
      height: elementH,
    } = el.getBoundingClientRect();

    const centerW = elementW / 2;
    const centerH = elementH / 2;

    const centeredX = elementX + centerW;
    const centeredY = elementY + centerH;

    return [centeredX, centeredY];

  }



  transformByRect(x, y){
    let { x: elementX, y: elementY, } = this.getBoundingClientRect();
    x = x - elementX;
    y = y - elementY;
    // console.log('OOO transformByRect', {elementX, elementY});
    return [x, y];
  }
  // transformByScroll(x, y){

  //   const scrollLeft = window.scrollX;
  //   const scrollTop = window.scrollY;

  //   x = x - scrollLeft;
  //   y = y - scrollTop;
  //   return [x, y];
  // }
  transformByScale(x, y){
    const scale = this.scale.value;
    x = x / scale;
    y = y / scale;
    // console.log('OOO transformByScale', {scale});
    return [x, y];
  }
  transformByPan(x, y){
    let panX = this.panX.value;
    let panY = this.panY.value;

    // NOTE: pan values are raw and must always be transformed by scale before use
    [panX, panY] = this.transformByScale(panX, panY)

    x = x - panX;
    y = y - panY;
    // console.log('OOO transformByPan', {panX, panY});

    return [x, y];
  }
  transform(x, y){

    [x, y] = this.transformByRect(x, y);
    // [x, y] = this.transformByScroll(x, y);
    [x, y] = this.transformByScale(x, y);
    [x, y] = this.transformByPan(x, y);
    return [x, y];
  }


  // GARBAGE COLLECTION

  #garbage = [];
  collectGarbage() {
    this.#garbage.map((s) => s.subscription());
  }

  set gc(subscription) {
    // shorthand for component level garbage collection
    this.#garbage.push({
      type: "gc",
      id: "gc-" + this.#garbage.length,
      ts: new Date().toISOString(),
      subscription,
    });
  }
}
