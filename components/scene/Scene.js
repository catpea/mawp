import Signal from 'signal';

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
        .toolbar {
         	position: absolute;
          top: 1rem;
          left: 1rem;

        }
        .cli {
          background-color: #343a40;
          border-radius: 32px;
         	position: absolute;
         	bottom: 1rem;
         	left: 1rem;
         	right: 1rem;
          padding: .1rem;

          .cli-send {
            position: absolute;
            right: 1rem;
            top: .69rem;
          }

          .cli-control {
           border-radius: 32px;
            border: none;
            background-color: transparent;
            width: 100%;
            padding: .5rem 1rem;
            caret-color: rgb(15, 203, 140);

            font-family: Manrope, Arial, sans-serif;
            font-size: 16px;
            font-weight: 400;

            &:focus-visible {
              outline: none;
            }
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

        <div class="toolbar">
          <div class="btn-toolbar vertical" role="toolbar" aria-label="Toolbar with button groups" style="left: 0px; top: 0px; z-index: 10;">
            <div class="btn-group-vertical mb-2" role="group" aria-label="First group">
              <button type="button" class="btn btn-outline-secondary" title="Send Start"><i class="bi bi-play"></i></button>
              <button type="button" class="btn btn-outline-secondary" title="Send Start"><i class="bi bi-pause"></i></button>
              <button type="button" class="btn btn-outline-secondary" title="Send Stop"><i class="bi bi-stop"></i></button>
              <button type="button" class="btn btn-outline-secondary" title="Send Kill"><i class="bi bi-capsule"></i></button>

              <button type="button" class="btn btn-outline-secondary" title="Clear Stage"  data-bs-content="Clear the stage of all actors and begin a new project."><i class="bi bi-eraser"></i></button>
              <button type="button" class="btn btn-outline-secondary" title="Open File"  data-bs-content="Load data from your computer."><i class="bi bi-folder2-open"></i></button>
              <button type="button" class="btn btn-outline-secondary"><i class="bi bi-save"></i></button>
              <button type="button" class="btn btn-outline-secondary" title="New Block"  data-bs-content="Add a new function to your program."><i class="bi bi-tools"></i></button>

              <button type="button" class="btn btn-outline-secondary" title="Generate Code"  data-bs-content="Generate a standalone program that does not require sweetpea to run."><i class="bi bi-box-seam"></i></button>
              <button type="button" class="btn btn-outline-secondary" title="Save Program"  data-bs-content="Save project to your computer."><i class="bi bi-floppy"></i></button>
              <button type="button" class="btn btn-outline-secondary" title="Function Creator"  data-bs-content="Add a new function to your program."><i class="bi bi-puzzle"></i></button>

              <button type="button" class="btn btn-outline-secondary"><i class="bi bi-zoom-in"></i></button>
              <button type="button" class="btn btn-outline-secondary"><i class="bi bi-zoom-out"></i></button>
              <button type="button" class="btn btn-outline-secondary"><i class="bi bi-aspect-ratio"></i></button>

            </div>
          </div>
        </div>

        <div class="cli">
          <i class="cli-send bi bi-send-fill"></i>
          <input type="text" class="cli-control" placeholder=": (buttons/menus are not yet connected but you can drag a window)">
        </div>




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
