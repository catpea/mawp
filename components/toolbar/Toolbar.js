import Signal from 'signal';
import lol from 'lol';
import transcend from 'transcend';

export default class Console extends HTMLElement {

    constructor() {
      super();
      this.status = new Signal('loading');

      const localStyle = `
        .toolbar {
         	position: absolute;
          top: 1rem;
          left: 1rem;
        }
      `;
      const localCss = new CSSStyleSheet();
      localCss.replaceSync(localStyle.trim());

      const shadow = this.attachShadow({ mode: 'open' });
      shadow.adoptedStyleSheets = [...document.adoptedStyleSheets, localCss];

      this.container = lol.div({ class: 'toolbar' });
      this.container.innerHTML = `
        <div class="position-absolute btn-toolbar vertical" style="left: 0px; top: 0px; z-index: 10;">

        <div class="btn-group-vertical mb-2" role="group" aria-label="First group">
          <button type="button" class="btn btn-outline-secondary opacity-25" title="Send Start"><i class="bi bi-play"></i></button>
          <button type="button" class="btn btn-outline-secondary opacity-25" title="Send Start"><i class="bi bi-pause"></i></button>
          <button type="button" class="btn btn-outline-secondary opacity-25" title="Send Stop"><i class="bi bi-stop"></i></button>
          <button type="button" class="btn btn-outline-secondary opacity-25" title="Send Kill"><i class="bi bi-capsule"></i></button>
        </div>

        <div class="btn-group-vertical mb-2">
          <button name="create-window" type="button" class="btn btn-outline-secondary" title="create window"  data-bs-content="Clear the stage of all actors and begin a new project."><i class="bi bi-plus-circle"></i></button>
          <button type="button" class="btn btn-outline-secondary opacity-25" title="Clear Stage"  data-bs-content="Clear the stage of all actors and begin a new project."><i class="bi bi-eraser"></i></button>
          <button type="button" class="btn btn-outline-secondary opacity-25" title="Open File"  data-bs-content="Load data from your computer."><i class="bi bi-folder2-open"></i></button>
          <button type="button" class="btn btn-outline-secondary opacity-25"><i class="bi bi-save"></i></button>
          <button type="button" class="btn btn-outline-secondary opacity-25" title="New Block"  data-bs-content="Add a new function to your program."><i class="bi bi-tools"></i></button>
        </div>

        <div class="btn-group-vertical mb-2">
          <button type="button" class="btn btn-outline-secondary opacity-25" title="Generate Code"  data-bs-content="Generate a standalone program that does not require sweetpea to run."><i class="bi bi-box-seam"></i></button>
          <button type="button" class="btn btn-outline-secondary opacity-25" title="Save Program"  data-bs-content="Save project to your computer."><i class="bi bi-floppy"></i></button>
          <button type="button" class="btn btn-outline-secondary opacity-25" title="Function Creator"  data-bs-content="Add a new function to your program."><i class="bi bi-puzzle"></i></button>

          <button type="button" class="btn btn-outline-secondary opacity-25"><i class="bi bi-zoom-in"></i></button>
          <button type="button" class="btn btn-outline-secondary opacity-25"><i class="bi bi-zoom-out"></i></button>
          <button type="button" class="btn btn-outline-secondary opacity-25"><i class="bi bi-aspect-ratio"></i></button>

        </div>

        <div class="btn-group-vertical mb-2">
          <button name="main-scene" type="button" class="btn btn-outline-secondary" title="Switch to main scene"><i class="bi bi-arrow-return-left"></i></button>
        </div>


        </div>
      `;



      // this.appendChild(this.container);
      shadow.appendChild(this.container);

    }

    connectedCallback() {

      const application = transcend(this, `x-application`);
      const scene = transcend(this, `x-scene`);
      if(!application) throw new Error('Unable to locate applicaion!')

      const createWindowButton = this.container.querySelector('[name="create-window"]');
      createWindowButton.addEventListener("click", function (e) {
        const [left, top] = scene.getCenterDropCoordinates();
        application.project.commander.windowCreate({left, top});
      });

      const mainSceneButton = this.container.querySelector('[name="main-scene"]');

      mainSceneButton.addEventListener("click", function (e) {
        application.project.commander.sceneSelect({id:'main'});
      });

      application.project.activeScene.subscribe(activeScene=>{
        if(activeScene==='main'){
          mainSceneButton.classList.remove(...Array.from(mainSceneButton.classList).filter(className => className.startsWith('btn-outline-')) )
          mainSceneButton.classList.add('btn-outline-secondary');
          mainSceneButton.disabled = true;
        }else{
          mainSceneButton.classList.remove(...Array.from(mainSceneButton.classList).filter(className => className.startsWith('btn-outline-')) )
          mainSceneButton.classList.add('btn-outline-success');
          mainSceneButton.disabled = false;
        }
      })
      this.status.value = 'ready';
    }

  }
