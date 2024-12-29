import config from 'vpl-configuration';

// CSS
const cssUrls = ['./static/css/style.css', './static/css/bootstrap.min.css','./static/css/bootstrap-icons.min.css'];
const cssFiles = (await Promise.all(cssUrls.map(url => fetch(url).then(res => res.text()))));
document.adoptedStyleSheets = cssFiles.map(str => { const css = new CSSStyleSheet(); css.replaceSync(str); return css;})

// COMPONENTS
import DomWindow from 'dom-window';
import DomPipe from 'dom-pipe';
import DomZoom from 'dom-zoom';

customElements.define(`${config.prefix}-window`, DomWindow);
customElements.define(`${config.prefix}-pipe`, DomPipe);
customElements.define(`${config.prefix}-zoom`, DomZoom);

export default class UI {
  services;
  constructor(services){
    this.services = services;
  }

  async start(){

    this.app = document.createElement('div');
    this.scene = document.createElement('dom-zoom');
    this.app.appendChild(this.scene);
    document.body.appendChild(this.app)

    this.watch();
  }
  async stop(){

  }

  // =^o.O^= //
  watch(){
    this.gc = this.services.watch('create', '/services/main/*', ({target})=>{
      const win = document.createElement(`${config.prefix}-window`);
      win.id = target.id;
      // NOTE: this is a data pipeline that AUTOMATICALLY moves dataset of a plain object to the attributes of a DOM node.
      this.gc = target.dataset.subscribe((k, v) => win.setAttribute('data-'+k, v));
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
