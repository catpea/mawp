import Signal from 'signal';
import lol from 'lol';

export default class Prompt extends HTMLElement {

    constructor() {
      super();
      this.status = new Signal('loading');

      const localStyle = `
        .prompt {
          opacity: .9;
          background-color: #343a40;
          border-radius: 32px 8px 8px 32px;
         	position: absolute;
         	bottom: 1rem;
         	left: 1rem;
         	right: 1rem;
          padding: .1rem;

          .prompt-send {
            position: absolute;
            right: 1rem;
            top: .69rem;
          }

          .prompt-control {
           border-radius: 32px;
            border: none;
            background-color: transparent;
            width: 100%;
            padding: .5rem 1rem;
            caret-color: rgb(15, 203, 140);

            font-family: Manrope, Arial, sans-serif;
            font-size: 16px;
            font-weight: 400;

            &:focus-visible {
              outline: none;
            }
          }
        }

      `;
      const localCss = new CSSStyleSheet();
      localCss.replaceSync(localStyle.trim());

      const shadow = this.attachShadow({ mode: 'open' });
      shadow.adoptedStyleSheets = [...document.adoptedStyleSheets, localCss];

      const container = lol.div({ class: 'prompt' });
      container.innerHTML = `
        <input type="text" class="prompt-control" placeholder=": (buttons/menus are not yet connected but you can drag a window)">
        <i class="prompt-send bi bi-send-fill"></i>
      `;
      this.appendChild(container);
      shadow.appendChild(container);

    }

    connectedCallback() {
      this.status.value = 'ready';
    }

  }
