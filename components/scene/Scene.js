import Signal from "signal";
import lol from "lol";

import Pannable from "./Pannable.js";

export default class Scene extends HTMLElement {
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
      }

      .content {
        transform-origin: 0 0;
        min-height: 100vh;
      }

        .illustration {
          // border-radius: 16px 0 0 0;
          background-color: var(--bs-body-bg);
          pointer-events: none;

          position: absolute;
          width: 100%;
          height: 100%;

          overflow: visible; /* does not cut off the lines when dragging outside into minus space */

          &.illustration-foreground {
            background-color: transparent;
          }

          .illustration-dot {
            fill: var(--bs-border-color)
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
        <div class="content">
          <svg class="illustration illustration-background">
            <defs>
              <pattern id="graph-pattern" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
                <circle class="illustration-dot" r="1" cx="2.2" cy="2.2"></circle>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#graph-pattern)" opacity="0.5"></rect>
          </svg>
          <slot></slot>
          <svg class="illustration illustration-foreground"></svg>
        </div>
        <x-toolbar></x-toolbar>
        <x-prompt></x-prompt>
        <x-console></x-console>

        <span class="position-absolute top-0 start-50 dtranslate-middle opacity-25">
          pan=<small name="debug-panX"></small>x<small name="debug-panY"></small> scale=<small name="debug-scale"></small>
        </span>

    `;

    shadow.appendChild(this.container);

    const pannable = new Pannable(this);
    this.gc = pannable.start();
  }

  // fires after the element has been attached to the DOM
  connectedCallback() {
    this.panX.subscribe(v => this.container.querySelector('[name="debug-panX"]').textContent = Number.parseFloat(v).toFixed(0));
    this.panY.subscribe(v => this.container.querySelector('[name="debug-panY"]').textContent = Number.parseFloat(v).toFixed(0));
    this.scale.subscribe(v => this.container.querySelector('[name="debug-scale"]').textContent = Number.parseFloat(v).toFixed(2));

    this.status.value = "ready";
  }

  // QUESTIONABLE BUT USEFUL UTILITY FUNCTIONS

  get drawingSurfaces() {
    return this.shadowRoot.querySelectorAll("svg");
  }

  getElementById(id) {
    const response = this.querySelector(`[id=${id}]`);
    return response;
  }

  getWindow(colonAddress) {
    const [elementId, portId] = colonAddress.split(/\W/, 2);
    const element = this.getElementById(elementId);
    return element;
  }

  getPort(colonAddress) {
    const [elementId, portId] = colonAddress.split(/\W/, 2);
    const element = this.getElementById(elementId);
    const port = element.getPortElement(portId);
    return port;
  }

  getDecal(colonAddress) {
    const [elementId, portId] = colonAddress.split(/\W/, 2);
    const element = this.getElementById(elementId);
    if (!element) {
      throw new Error(`Element ${elementId} not found`);
    }

    const port = element.getPortElement(portId);
    if (!port) throw new Error(`Failed to locate port (${portId})`);
    const decal = port.getDecal();
    return decal;
  }

  calculateCentralCoordinates(el) {
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



  transformByScale(x, y){
    const scale = this.scale.value;
    x = x / scale;
    y = y / scale;
    return [x, y];
  }
  transformByPan(x, y){
    let panX = this.panX.value;
    let panY = this.panY.value;

    // NOTE: pan values are raw and must always be transformed by scale before use
    [panX, panY] = this.transformByScale(panX, panY)

    x = x - panX;
    y = y - panY;
    return [x, y];
  }
  transform(x, y){
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
