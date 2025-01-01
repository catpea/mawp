import config from 'system-configuration';

// CSS
const cssUrls = ['./static/css/style.css', './static/css/bootstrap.min.css','./static/css/bootstrap-icons.min.css'];
const cssFiles = (await Promise.all(cssUrls.map(url => fetch(url).then(res => res.text()))));
document.adoptedStyleSheets = cssFiles.map(str => { const css = new CSSStyleSheet(); css.replaceSync(str); return css;})

// COMPONENTS
import Pipe from 'pipe';
import Port from 'port';
import Window from 'window';
import Scene from 'scene';

// REGISTRATION
customElements.define(`${config.prefix}-pipe`, Pipe);
customElements.define(`${config.prefix}-port`, Port);
customElements.define(`${config.prefix}-window`, Window);
customElements.define(`${config.prefix}-scene`, Scene);

export default class UI {
  services;
  constructor(services){
    this.services = services;
  }

  async start(){

    this.app = document.querySelector('.app');
    this.scene = document.createElement(`${config.prefix}-scene`);
    this.app.appendChild(this.scene);


    this.watch();
  }
  async stop(){

  }

  // =^o.O^= //
  watch(){

    this.gc = this.services.watch('create', '/services/main/*', ({target})=>{

      const win = document.createElement(`${config.prefix}-${target.type}`);
      win.id = target.id;
      // NOTE: this is a data pipeline that AUTOMATICALLY moves dataset of a plain object to the attributes of a DOM node.
      this.gc = target.dataset.subscribe((k, v) => win.setAttribute('data-'+k, v));
      win.source = target;
      this.scene.appendChild(win);
    })

  }

  #garbage = [];
  collectGarbage(){
    this.#garbage.map(s=>s.subscription())
  }
  set gc(subscription){ // shorthand for component level garbage collection
    this.#garbage.push( {type:'gc', id:'gc-'+this.#garbage.length, ts:(new Date()).toISOString(), subscription} );
  }
}
