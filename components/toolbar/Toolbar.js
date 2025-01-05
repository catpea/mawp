import Signal from 'signal';
import lol from 'lol';

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

      const container = lol.div({ class: 'toolbar' });
      container.innerHTML = `
        <div class="btn-toolbar vertical" role="toolbar" aria-label="Toolbar with button groups" style="left: 0px; top: 0px; z-index: 10;">
          <div class="btn-group-vertical mb-2" role="group" aria-label="First group">

            <button type="button" class="btn btn-outline-secondary" title="Send Start"><i class="bi bi-play"></i></button>
            <button type="button" class="btn btn-outline-secondary" title="Send Start"><i class="bi bi-pause"></i></button>
            <button type="button" class="btn btn-outline-secondary" title="Send Stop"><i class="bi bi-stop"></i></button>
            <button type="button" class="btn btn-outline-secondary" title="Send Kill"><i class="bi bi-capsule"></i></button>

            <button type="button" class="btn btn-outline-secondary" title="Clear Stage"  data-bs-content="Clear the stage of all actors and begin a new project."><i class="bi bi-eraser"></i></button>
            <button type="button" class="btn btn-outline-secondary" title="Open File"  data-bs-content="Load data from your computer."><i class="bi bi-folder2-open"></i></button>
            <button type="button" class="btn btn-outline-secondary"><i class="bi bi-save"></i></button>
            <button type="button" class="btn btn-outline-secondary" title="New Block"  data-bs-content="Add a new function to your program."><i class="bi bi-tools"></i></button>

            <button type="button" class="btn btn-outline-secondary" title="Generate Code"  data-bs-content="Generate a standalone program that does not require sweetpea to run."><i class="bi bi-box-seam"></i></button>
            <button type="button" class="btn btn-outline-secondary" title="Save Program"  data-bs-content="Save project to your computer."><i class="bi bi-floppy"></i></button>
            <button type="button" class="btn btn-outline-secondary" title="Function Creator"  data-bs-content="Add a new function to your program."><i class="bi bi-puzzle"></i></button>

            <button type="button" class="btn btn-outline-secondary"><i class="bi bi-zoom-in"></i></button>
            <button type="button" class="btn btn-outline-secondary"><i class="bi bi-zoom-out"></i></button>
            <button type="button" class="btn btn-outline-secondary"><i class="bi bi-aspect-ratio"></i></button>

          </div>
        </div>
      `;
      this.appendChild(container);
      shadow.appendChild(container);

    }

    connectedCallback() {
      this.status.value = 'ready';
    }

  }
