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

        <slot></slot>

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

  get drawingSurfaces() {
    return this.shadowRoot.querySelectorAll('svg')
  }

  getElementById(id) {
    const response = this.querySelector(`[id=${id}]`);
    return response;
  }

  }
