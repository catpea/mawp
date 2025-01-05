import Signal from 'signal';
import lol from 'lol';

export default class Scene extends HTMLElement {

  pan = {x:0,y:0};
  zoom = 1;

    constructor() {
      super();
      const localStyle = `

        .illustration {
          // border-radius: 16px 0 0 0;
          background-color: #212529;
          pointer-events: none;
          width: 100%;
          height: 100%;
          position: absolute;
          top: 0;
          left: 0;
          &.illustration-foreground {
            opacity: .1;
          }
          .illustration-dot {
            fill: siver;
          }
        }
      `;
      const localCss = new CSSStyleSheet();
      localCss.replaceSync(localStyle.trim());

      this.status = new Signal('loading');

      const shadow = this.attachShadow({ mode: 'open' });

      shadow.adoptedStyleSheets = [...document.adoptedStyleSheets, localCss];

      const container = document.createElement('div');
      // container.classList.add('position-relative');

      container.innerHTML = `
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

        <x-toolbar></x-toolbar>
        <x-prompt></x-prompt>
        <x-console></x-console>

      `;

      shadow.appendChild(container);
    }


    // fires after the element has been attached to the DOM
    connectedCallback() {
      this.status.value = 'ready';
    }




  // QUESTIONABLE BUT USEFUL UTILITY FUNCTIONS


  get drawingSurfaces() {
    return this.shadowRoot.querySelectorAll('svg')
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

      throw new Error(`Element ${elementId} not found`)
    }

    const port = element.getPortElement(portId);
    const decal = port.getDecal();
    return decal;
  }

  calculateCentralCoordinates(el) {

        // let {x:sceneX,y:sceneY, width:sceneW, height:sceneH} = this.getBoundingClientRect();


        let {x:elementX,y:elementY, width:elementW, height:elementH} = el.getBoundingClientRect();

        const scrollLeft = window.scrollX;
        const scrollTop = window.scrollY;



        elementX = elementX + scrollLeft;
        elementY = elementY + scrollTop;

        let {x:panX,y:panY} = this.pan;
        let zoom = this.zoom;

        elementX = elementX / zoom;
        elementY = elementY / zoom;

        elementW = elementW / zoom;
        elementH = elementH / zoom;

        const centerW = elementW/2;
        const centerH = elementH/2;

        panX = panX / zoom;
        panY = panY / zoom;

        const positionedX = elementX-panX;
        const positionedY = elementY-panY;

        const centeredX = positionedX+centerW;
        const centeredY = positionedY+centerH;

        return [ centeredX, centeredY ];
      }

      // GARBAGE COLLECTION

      #garbage = [];
      collectGarbage(){
        this.#garbage.map(s=>s.subscription())
      }

      set gc(subscription){ // shorthand for component level garbage collection
        this.#garbage.push( {type:'gc', id:'gc-'+this.#garbage.length, ts:(new Date()).toISOString(), subscription} );
      }
  }
