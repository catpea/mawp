//NOTE: on start we create a x-instruments web component that contins a bootstrap modal
// the modal is shown onContextMenu

import Signal from 'signal';
import Forms from 'forms';

import lol from 'lol';
import guid from 'guid';
import transcend from 'transcend';

import ReactiveHTMLElement from '../ReactiveHTMLElement.js';

class Instruments extends ReactiveHTMLElement {
  selected = new Signal(); // the item selected for user reveiew
  request; // stores coordinates

  constructor() {
    super();
    this.status = new Signal('loading');

    const localStyle = `
      .frosted-glass {
        background-color: rgba(var(--bs-dark-rgb), 0.1)!important;
        backdrop-filter: blur(10px)!important;
      }
    `;
    const localCss = new CSSStyleSheet();
    localCss.replaceSync(localStyle.trim());

    const shadow = this.attachShadow({ mode: 'open' });
    shadow.adoptedStyleSheets = [...document.adoptedStyleSheets, localCss];

    this.container = document.createElement('div');
    this.container.classList.add('modal', 'fade');

    this.container.innerHTML = `
      <div class="modal-dialog modal-dialog-scrollable modal-lg">
        <div class="modal-content" style="background-color: rgba(var(--bs-dark-rgb), 0.1)!important; backdrop-filter: blur(10px)!important;">
          <div class="modal-header">
            <h5 class="modal-title">Toolbox</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <div class="row">
              <div id="module-listing-container" class="col-5">
              </div>
              <div id="module-description" class="col">

              </div>
            </div>
          </div>
          <small class="text-secondary p-2"><i class="bi bi-info-circle"></i> Double-click to quickly add to stage.</small>
          <div class="modal-footer">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal"><i class="bi bi-x"></i> Cancel</button>
            <button id="create-button" type="button" class="btn btn-primary" disabled><i class="bi bi-plus"></i> Use</button>
          </div>
        </div>
      </div>
    `;

    shadow.appendChild(this.container);
    this.modal = new bootstrap.Modal(this.container, {});
    const createButton = shadow.getElementById('create-button');
    this.selected.subscribe(v=>createButton.disabled=v.path?false:true);
    //this.selected.subscribe(v=>console.log('TTT createButton.disabled', v.path?false:true));
    this.gc = this.listenTo(createButton, 'click', ()=>this.addComponent({path: this.selected.value.path, ...this.request}));
    const moduleDescription = shadow.getElementById('module-description');
    this.gc = this.selected.subscribe(v=>{
      moduleDescription.innerHTML = `
        <div class="col d-flex flex-column align-items-start gap-2">
          <h2 name="name" class="fw-bold text-body-emphasis"></h2>
          <p name="description" class="text-body-secondary">P</p>
          <!--<a class="btn btn-primary btn-lg">Primary button</a>-->
        </div>
      `;
      this.assignText(v, moduleDescription);
    })
  }

  connectedCallback() {
    // Create Module Listing
    const instrumentsCategories = document.createElement('ul');
    instrumentsCategories.classList.add('list-unstyled', 'ps-0');
    // Add Modules
    // const categories = this.source.root.get('modules');
    const categories = this.application.source.get('modules');
    for(const parent of categories.children){
        const instrumentsCategory = document.createElement('li');
        instrumentsCategory.classList.add('mb-1');
        const collapseId = guid();
        instrumentsCategory.innerHTML = `
          <button class="btn btn-toggle d-inline-flex align-items-center rounded border-0 ps-2 fs-5" data-bs-toggle="collapse" data-bs-target="#${collapseId}">
            ${parent.settings.name}
          </button>
          <div class="collapse show" id="${collapseId}">
            <ul class="btn-toggle-nav list-unstyled fw-normal ps-3 pb-1 small">
            </ul>
          </div>
        `;
      instrumentsCategories.appendChild(instrumentsCategory)
      // Add Instruments
      for(const child of parent.children){
        const item = document.createElement('li');
        const path = [ parent.id, child.id ].join('/');
        const click =()=> this.selected.value = { // select
          id: child.id,
          name: child.settings.name,
          description: child.settings.description,
          path,
          parent, child,
        };
        const dblclick =()=> this.addComponent({path, ...this.request}); // add instantly
        const selector = lol.a({class:'d-inline-flex text-decoration-none rounded fs-6 user-select-none', on:{click, dblclick}, textContent: child.settings.name},  )
        item.appendChild(selector);
        instrumentsCategory.querySelector('ul').appendChild(item)
      }
    }
    // Add Full Module Listing
    const moduleListingContainer = this.shadowRoot.getElementById('module-listing-container');
    moduleListingContainer.appendChild(instrumentsCategories)
  };

  async addComponent(options){
    //console.warn('addComponent', options)
    const application = transcend(this, `x-application`);
    await application.source.commander.componentCreate(options);
    this.modal.hide();
  }
}


export default class Constructible {
  sceneComponent;
  targetElement;
  svgMarkerDot;
  #mouseCoordinates = { x: 0, y: 0 };

  constructor(sceneComponent) {
    this.sceneComponent = sceneComponent;
    //NOTE: we are adding to shadow root, beneath .content
    this.targetElement = this.sceneComponent.shadowRoot; //.querySelector(".content");
    this.positioningElement = this.sceneComponent.shadowRoot.querySelector(".content");

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
    const [x,y] = this.sceneComponent.transform(event.clientX, event.clientY);
    this.#mouseCoordinates = {x, y};
    //console.log(event, this.#mouseCoordinates );

     const svgSurface = this.sceneComponent.drawingSurfaces[1];
     if(!this.svgMarkerDot) this.svgMarkerDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
     this.svgMarkerDot.setAttribute('r',  32);
     this.svgMarkerDot.setAttribute('fill', 'rgba(255,0,0,0.3)');
     this.svgMarkerDot.setAttribute('cx', x);
     this.svgMarkerDot.setAttribute('cy', y);
     svgSurface.appendChild(this.svgMarkerDot);
     setTimeout(()=>{this.svgMarkerDot.remove(); this.svgMarkerDot = null;}, 300)

     this.instruments.request = { left:x, top:y }; // partion information for command execution; // sent to instrument component that holds modal
     this.instruments.modal.show();

  }

}



customElements.define(`x-instruments`, Instruments);
