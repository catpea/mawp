// CSS
const cssUrls = ['./static/css/style.css', './static/css/bootstrap.min.css','./static/css/bootstrap-icons.min.css'];
const cssFiles = (await Promise.all(cssUrls.map(url => fetch(url).then(res => res.text()))));
document.adoptedStyleSheets = cssFiles.map(str => { const css = new CSSStyleSheet(); css.replaceSync(str); return css;})

// COMPONENTS
import Pipe from 'pipe';
import Port from 'port';
import Window from 'window';
import Scene from 'scene';
import Application from 'application';
import Prompt from 'prompt';
import Console from 'console';
import Toolbar from 'toolbar';

// REGISTRATION

// Structural
customElements.define(`x-applicaion`, Application);

// Critical
customElements.define(`x-port`, Port);
customElements.define(`x-window`, Window);
customElements.define(`x-pipe`, Pipe);
customElements.define(`x-scene`, Scene);

// Helpers
customElements.define(`x-toolbar`, Toolbar);
customElements.define(`x-prompt`, Prompt);
customElements.define(`x-console`, Console);






export default class UI {

  applicaion;

  xApplicaion;
  xScene;

  constructor(applicaion){
    this.applicaion = applicaion;
  }

  async start(){
    this.mountPoint = document.querySelector('.app');
    this.xApplication = document.createElement(`x-application`);
    this.xApplication.project = this.project;
    this.xScene = document.createElement(`x-scene`);
    this.xApplication.appendChild(this.xScene);
    this.mountPoint.appendChild(this.xApplication);
    this.xApplicaion.activeLocation.subscribe(v=>this.watch(v))
  }

  removeWebComponent({id}){
    this.xScene.getElementById(id).remove();
  }

  addWebComponent(location){
    const tagName = `x-${location.type}`;
    const component = document.createElement(tagName);
    component.id = location.id;

    // NOTE: here we inject server side project into uiser interface elements
    component.project = this.project;

    // NOTE: agent is transported here
    component.agent = location.agent;

    // NOTE: this is a data pipeline that AUTOMATICALLY moves dataset of a plain object to the attributes of a DOM node.
    this.locationGarbageCollector = location.dataset.subscribe((k, v) => component.setAttribute('data-'+k, v));
    this.xApplication.querySelector('x-scene').appendChild(component);
    this.locationGarbageCollector = () => component.remove();
  }

  async stop(){
    this.clearSceneGarbage();
    this.collectGarbage();
  }




  // =^o.O^= //
  watch(locationName){
    console.log(`Watching locationName: ${locationName}`)
    this.clearLocationGarbage()

    // MONITORING
    this.locationGarbageCollector = this.project.watch('create', `/applicaion/main-project/${locationName}/*`, ({target})=> this.addWebComponent(target));
    this.locationGarbageCollector = this.project.watch('delete', `/applicaion/main-project/${locationName}`, ({target})=> this.removeWebComponent(target));

    // INSTALLATION
    const location = this.applicaion.get('project-main').get(locationName);
    for(const child of location.children){
      this.addWebComponent(child)
    }
    console.log(`Installed ${location.children.length} WebComponents`);

  }

  // PER LOCATION GARBAGE
  #locationGarbage = [];
  clearLocationGarbage(){
    this.#locationGarbage.map(s=>s.subscription())
    this.#locationGarbage = [];
  }
  set locationGarbageCollector(subscription){ // shorthand for component level garbage collection
    this.#locationGarbage.push( {type:'gc', id:'gc-'+this.#garbage.length, ts:(new Date()).toISOString(), subscription} );
  }

  // MAIN GARBAGE
  #garbage = [];
  collectGarbage(){
    this.#garbage.map(s=>s.subscription())
  }
  set gc(subscription){ // shorthand for component level garbage collection
    this.#garbage.push( {type:'gc', id:'gc-'+this.#garbage.length, ts:(new Date()).toISOString(), subscription} );
  }
}
