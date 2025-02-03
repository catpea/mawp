import Signal from 'signal';
import Forms from 'forms';

import lol from 'lol';
import guid from 'guid';
import transcend from 'transcend';

import ReactiveHTMLElement from '../ReactiveHTMLElement.js';

class Switcher extends ReactiveHTMLElement {
  selected = new Signal(); // the item selected for user reveiew

  constructor() {
    super();
    this.status = new Signal('loading');
    const localStyle = ``;
    const localCss = new CSSStyleSheet();
    localCss.replaceSync(localStyle.trim());
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.adoptedStyleSheets = [...document.adoptedStyleSheets, localCss];

    this.container = document.createElement('div');
    this.container.classList.add('bork');
    this.container.innerHTML = ``;
    shadow.appendChild(this.container);

  }

  connectedCallback() {
  };

}


export default class Constructible {
  sceneComponent;
  targetElement;
  svgMarkerDot;
  #mouseCoordinates = { x: 0, y: 0 };

  constructor(sceneComponent) {
    this.sceneComponent = sceneComponent;
    this.targetElement = this.sceneComponent.shadowRoot; //.querySelector(".content");
    this.onContextMenu = this.onContextMenu.bind(this);
  }

  start() {
    this.sceneComponent.addEventListener("contextmenu", this.onContextMenu);
    // NOTE: installing the modal instrumentbox
    this.instruments = document.createElement('x-instruments');
    this.targetElement.appendChild(this.instruments);
    return () => this.stop();
  }

  stop() {
    this.sceneComponent.removeEventListener("contextmenu", this.onContextMenu);
    this.instruments.remove();
  }

  onContextMenu(event) {
    event.preventDefault();
  }

}

customElements.define(`x-switcher`, Switcher);
