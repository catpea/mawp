import Signal from 'signal';
import Forms from 'forms';

import lol from 'lol';
import gui from 'gui';
import guid from 'guid';
import transcend from 'transcend';

import ReactiveHTMLElement from '../ReactiveHTMLElement.js';

// LISTS ALL SCENES IN THE SYSTEM, ALLOWS CHANGE WITH A DROPDOWN MENU
class Switcher extends ReactiveHTMLElement {
  static tag = 'x-switcher';

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

    this.container.innerHTML = `
      <div class="btn-group">
        <button name="caption" type="button" class="btn btn-danger">Action</button>
        <button type="button" class="btn btn-danger dropdown-toggle dropdown-toggle-split" data-bs-toggle="dropdown" aria-expanded="false">
          <span class="visually-hidden">Toggle Dropdown</span>
        </button>
        <ul name="list" class="dropdown-menu">
        </ul>
      </div>
    `;

          // <li><a class="dropdown-item" href="#">Action</a></li>
          // <li><a class="dropdown-item" href="#">Another action</a></li>
          // <li><a class="dropdown-item" href="#">Something else here</a></li>
          // <li><hr class="dropdown-divider"></li>
          // <li><a class="dropdown-item" href="#">Separated link</a></li>

    // const currentScene = this.source.get('main-project', this.source.activeLocation.value);


    shadow.appendChild(this.container);

  }

  connectedCallback() {

    const dropdownElementList = this.container.querySelectorAll('.dropdown-toggle');
    const dropdownList = [...dropdownElementList].map(dropdownToggleEl => new gui.Dropdown(dropdownToggleEl))
    dropdownList.map(o=>this.gc = o.start());

    const buttonCaptionElement = this.container.querySelector('[name=caption]');
    this.application.source.activeLocation.subscribe(sceneName=>{
      const node = this.application.source.get('main-project', sceneName);
      buttonCaptionElement.textContent = node.settings.get('title') + ' Scene';
    });

    const sceneList = this.container.querySelector('[name=list]');
    const project = this.application.source.get('main-project');

    for(const scene of project.children){
        const click =e=> this.application.source.activeLocation.value = scene.id;
        sceneList.appendChild(lol.li({}, lol.button({class:'dropdown-item', on:{click}}, scene.settings.get('title'))))
      // }
    }

  };

}

// INSTALLS ELEMENT - MANGES LIFECYCLE
export default class Switchable {
  sceneComponent;
  targetElement;
  switcherElement;

  constructor(sceneComponent) {
    this.sceneComponent = sceneComponent;
    this.targetElement = this.sceneComponent.toolbar.horizontal;
  }

  start() {
    this.switcherElement = document.createElement(Switcher.tag);
    this.targetElement.appendChild(this.switcherElement);
    return () => this.stop();
  }

  stop() {
    this.this.switcherElement.remove();
  }

}

customElements.define(Switcher.tag, Switcher);
