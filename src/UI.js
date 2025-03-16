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

  previousLocationName;
  constructor(source){
    this.source = source;
  }

  async start(){

    // Create application, give it a scene and mount it.
    this.application = document.createElement(`x-application`);
    this.application.source = this.source;

    this.scene = document.createElement(`x-scene`);
    // this.scene.source = this.source;
    // this.source.activeLocation.subscribe(v=> )
    // const currentScene = this.source.get('main-project', this.source.activeLocation.value);

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
    const tagName = `x-${source.settings.get('type', 'value')}`;
    const component = document.createElement(tagName);
    component.id = source.id;
    component.source = source;

    // UPGRADE TO source.settings
    // NOTE: this is a data pipeline that AUTOMATICALLY moves dXXXataset of a plain object to the attributes of a DOM node.
    // no longer used! use source.settings directly, we aim for single source of truth, DOM Web Components turned out to be too easy to treat with heavy magic. this.locationGarbageCollector = source.dXXXataset.subscribe((k, v) => component.setAttribute('data-'+k, v));


    this.scene.appendChild(component);
    this.locationGarbageCollector = () => component.remove();
  }

  async stop(){
    this.clearSceneGarbage();
    this.collectGarbage();
  }

  watch(newLocationName){
    if(!newLocationName) throw new Error('A watcher requires the name of a scene to monitor')

    console.log(`Watching locationName: ${newLocationName}`)
    // this.project.activeScene
    this.clearLocationGarbage()

    // MONITORING
    this.locationGarbageCollector = this.source.watch('create', `main-project/${newLocationName}/*`, ({target})=> this.addWebComponent(target));
    this.locationGarbageCollector = this.source.watch('delete', `main-project/${newLocationName}`, ({target})=> this.removeWebComponent(target));

    // INSTALLATION
    const location = this.source.get('main-project', newLocationName);

    for(const child of location.children){
      this.addWebComponent(child)
    }

    console.log(`Installed ${location.children.length} WebComponents`);

    this.restore(newLocationName);
  }

  restore(newLocationName){

    if(this.previousLocationName){
      // We have a previous location, save current pan to its memory.
      const previousLocation = this.source.get('main-project', this.previousLocationName);
      const restore = JSON.stringify({ panX: this.scene.panX.value, panY: this.scene.panY.value, scale: this.scene.scale.value, });
      previousLocation.settings.set('restore', 'value', restore);
    }

    const newLocation = this.source.get('main-project', newLocationName);
    if(newLocation.settings.has('restore')){
      const restore = JSON.parse(newLocation.settings.get('restore'));
      console.log('UUU location.restore', restore)
      this.scene.panX.value = restore.panX;
      this.scene.panY.value = restore.panY;
      this.scene.scale.value = restore.scale;
    }else{
      this.scene.panX.value = 0;
      this.scene.panY.value = 0;
      this.scene.scale.value = 1;
    }
    this.previousLocationName = newLocationName;
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
