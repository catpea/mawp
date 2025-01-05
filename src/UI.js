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
  project;
  constructor(project){
    this.project = project;
  }

  async start(){

    this.mountPoint = document.querySelector('.app');
    this.application = document.createElement(`x-application`);
    this.application.project = this.project;
    this.scene = document.createElement(`x-scene`);
    this.application.appendChild(this.scene);
    this.mountPoint.appendChild(this.application);

    this.project.activeScene.subscribe(v=>this.watch(v))
    // this.watch(this.project.activeScene.value);

  }

  addComponent(branch){
      const component = document.createElement(`x-${branch.type}`);
      component.id = branch.id;
      component.project = this.project;
      // component.source = branch;

      // NOTE: this is a data pipeline that AUTOMATICALLY moves dataset of a plain object to the attributes of a DOM node.
      this.sceneGarbage = branch.dataset.subscribe((k, v) => component.setAttribute('data-'+k, v));
      this.application.querySelector('x-scene').appendChild(component);
      this.sceneGarbage = () => component.remove();
  }


  async stop(){
    // this.clearSceneGarbage();
    // this.collectGarbage();
  }




  // =^o.O^= //
  #watching = false;
  watch(sceneName){
    console.log(`Watching sceneName ${sceneName}`);

    // this.project.activeScene
    this.clearSceneGarbage()

    const watchPath = `/project/${sceneName}/*`;
    this.sceneGarbage = this.project.watch('create', watchPath, ({target})=>{
      this.addComponent(target)
    })

    const scenePath = `${sceneName}`;
    const scene = this.project.get(scenePath);
    for(const child of scene.children){
      this.addComponent(child)
    }

  }

  // PER SCENE GARBAGE
  #sceneGarbage = [];
  clearSceneGarbage(){
    this.#sceneGarbage.map(s=>s.subscription())
    this.#sceneGarbage = [];
  }
  set sceneGarbage(subscription){ // shorthand for component level garbage collection
    this.#sceneGarbage.push( {type:'gc', id:'gc-'+this.#garbage.length, ts:(new Date()).toISOString(), subscription} );
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
