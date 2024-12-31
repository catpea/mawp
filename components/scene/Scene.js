import Signal from 'signal';

export default class Scene extends HTMLElement {

  pan = {x:0,y:0};
  zoom = 1;

    constructor() {
      super();

      this.status = new Signal('loading');

      const shadow = this.attachShadow({ mode: 'open' });
      const container = document.createElement('div');

      container.innerHTML = `

        <style>

          svg {
            pointer-events: none;
            width: 100%;
            height: 100%;
            position: absolute;
            top: 0;
            left: 0;
          }

          .background-dot {
            fill: siver;
          }

        </style>

        <svg id="background">
          <defs>
            <pattern id="graph-pattern" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle class="background-dot" r="1" cx="2.2" cy="2.2"></circle>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#graph-pattern)" opacity="0.5"></rect>
        </svg>

        <div class="position-relative">
          <slot></slot>
        </div>

        <svg id="foreground" style="opacity: .1;">
        </svg>

        <div class="vpl-controls"><div>

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

  // foo() {
  //   const windowGeometryMonitor = new Signal();
  //   windowGeometryMonitor.addDependency(this.getWindowDimensionsSignal( colonAddress ));

  //   const decalCoordinatesMonitor = new Signal();
  //   decalCoordinatesMonitor.addDependency(this.getPortCoordinateSignal( colonAddress ));



  // }

  // getPortCoordinateSignal(colonAddress) {


  //   const port = this.getPort(colonAddress);
  //   const decal = port.getDecal();
  //   const coordinateSignal = new Signal();
  //   coordinateSignal.value = this.calculateCentralCoordinates(decal);


  //   coordinateSignal.addDependency( this.getWindow( colonAddress ).sizeSignal );
  //   // x.addDependency( this.getWindow( colonAddress ).sizeSignal );

  //   // this.getWindow(colonAddress).sizeSignal.subscribe(v => {

  //   //    coordinateSignal.value = this.calculateCentralCoordinates(decal);

  //   // })

  //   return coordinateSignal;
  // }



  calculateCentralCoordinates(el) {
        let {x:elementX,y:elementY, width:elementW, height:elementH} = el.getBoundingClientRect();

        const scrollLeft = window.scrollX || window.pageXOffset;
        const scrollTop = window.scrollY || window.pageYOffset;
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


  }
