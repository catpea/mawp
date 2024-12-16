import config from 'vpl-configuration';

import DomActor from 'dom-actor';
import DomPipe from 'dom-pipe';
import DomZoom from 'dom-zoom';

customElements.define(`${config.prefix}-actor`, DomActor);
customElements.define(`${config.prefix}-pipe`, DomPipe);
customElements.define(`${config.prefix}-zoom`, DomZoom);

export default class UI {
  #services;
  constructor(services){
    this.#services = services;
  }

  async start(){
    const app = document.createElement('div');
    const zoom = document.createElement('dom-zoom');
    app.appendChild(zoom);
    document.body.appendChild(app)
    console.warn('TODO: reconcile selected service!!!!!')
    this.watch();
  }
  async stop(){

  }

  // =^o.O^= //
  watch(){
    //this.reconcile(...)
  }

  reconcile(){

  }
}
