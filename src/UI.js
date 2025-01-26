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

// WEB COMPONENT REGISTRATION

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

// BRIDGE CLASS
// it is a simple system that monitors selected scene:
// start
// watch
// stop
// addWebComponent
// removeWebComponent

export default class UI {

  // PLEASE NOTE: UI is a class that goes on top of the server applicaion.
  // on this level, web components have a .source that links back to the server data structure

  source;
  constructor(source){
    this.source = source;
  }

  async start(){

    // Create application, give it a scene and mount it.
    this.application = document.createElement(`x-application`);
    this.application.source = this.source;

    this.scene = document.createElement(`x-scene`);
    this.application.appendChild(this.scene);

    this.mountPoint = document.querySelector('.app');
    this.mountPoint.appendChild(this.application);

    // monitor activeLocation in scene
    this.source.activeLocation.subscribe(v=>this.watch(v))
  }

  removeWebComponent({id}){
    this.scene.getElementById(id).remove();
  }

  addWebComponent(source){
    const tagName = `x-${source.type}`;
    const component = document.createElement(tagName);
    component.id = source.id;
    component.source = source;
    // NOTE: this is a data pipeline that AUTOMATICALLY moves dataset of a plain object to the attributes of a DOM node.
    this.locationGarbageCollector = source.dataset.subscribe((k, v) => component.setAttribute('data-'+k, v));
    this.scene.appendChild(component);

    this.locationGarbageCollector = () => component.remove();
  }

  async stop(){
    this.clearSceneGarbage();
    this.collectGarbage();
  }

  watch(locationName){
    if(!locationName) throw new Error('A watcher requires the name of a scene tp monitor')

    console.log(`Watching locationName: ${locationName}`)
    // this.project.activeScene
    this.clearLocationGarbage()

    // MONITORING
    this.locationGarbageCollector = this.source.watch('create', `main-project/${locationName}/*`, ({target})=> this.addWebComponent(target));
    this.locationGarbageCollector = this.source.watch('delete', `main-project/${locationName}`, ({target})=> this.removeWebComponent(target));

    // INSTALLATION
    const location = this.source.get('main-project', locationName);
    for(const child of location.children){
      this.addWebComponent(child)
    }
    console.log(`Installed ${location.children.length} WebComponents`);

  }








  /// Internal
  /////////////////////////////////////////////////////////////////////////////////////////////////
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
