import Signal from 'signal';
import Forms from 'forms';

import lol from 'lol';

export default class Console extends HTMLElement {

    constructor() {
      super();
      this.status = new Signal('loading');

      const localStyle = `
        .console {
          opacity: .9;
          background-color: #343a40;
          border-radius: 6px;
         	position: absolute;
         	top: 1rem;
         	bottom: 4rem;
         	width: 33vw;
         	right: 1rem;
          padding: 1rem;
          overflow: scroll;
        }
      `;
      const localCss = new CSSStyleSheet();
      localCss.replaceSync(localStyle.trim());

      const shadow = this.attachShadow({ mode: 'open' });
      shadow.adoptedStyleSheets = [...document.adoptedStyleSheets, localCss];

      const container = document.createElement('div');
      container.innerHTML = `
        <div class="console">
        </div>
      `;
      this.appendChild(container);
      shadow.appendChild(container);

    }

    connectedCallback() {
      const forms = new Forms({gc: this.gc});

      // const application = this.parentNode.parentNode.host.closest(`x-application`);
      const application = this.closestAncestor(`x-application`);
      if(!application) throw new Error('Unable to locate applicaion!')
      const consoleContainer = this.shadowRoot.querySelector('.console');


       const sendToConsole = o => {
        // clearTimeout(timer); // will not allow;
        // timer = setTimeout(() => { allowPost=true }, timeout);

        // if (!allowPost) return;
        // allowPost = false;

        const commandForm = lol.form({});


        const commandContainer = lol.div({class: 'card card-dark mb-3'},
          lol.div({class: 'card-body'},
            commandForm
          )
        )

        commandForm.addEventListener("submit", function (e) {
          e.preventDefault();
          const formData = new FormData(commandForm);
          console.dir(...formData)
          const commandName = formData.get('commandName');
          formData.delete('commandName');
          const commandAttributes = Object.fromEntries(formData);
          application.project.commander[commandName](commandAttributes);
          commandContainer.remove()
        });


         commandForm.appendChild(lol.button({ class: 'btn btn-dark btn-sm position-absolute top-0 end-0', on: {click: ()=>commandContainer.remove()} }, lol.i({class:'bi bi-x-lg'})))
        commandForm.appendChild(lol.legend({ class:'fs-6 pb-0 mb-0'},`command: ${o.commandName}`))
        commandForm.appendChild( lol.small({ class:'opacity-25 mb-3 d-block'}, o.timestamp))
        commandForm.appendChild(forms.createHidden({name: 'commandName', value:o.commandName}))
        for (const [name, value] of Object.entries(o.commandArguments[0])) {
          commandForm.appendChild(forms.createCompactInput({name, value}))
        }
        commandForm.appendChild(lol.button({class:'btn btn-outline-secondary btn-sm float-end'}, 'Adjust'))


        consoleContainer.appendChild(commandContainer);
      };

       const timeouts = new Map();
       const delay = 300;

       this.gc = application.project.commander.on('executed', o => {

         if (timeouts.has(o.commandName)) {
           clearTimeout(timeouts.get(o.commandName));
         }

         const timeoutId = setTimeout(() => {
            sendToConsole(o);
            timeouts.delete(o.commandName);
          }, delay);

          timeouts.set(o.commandName, timeoutId);


       });

      this.status.value = 'ready';
    }

    closestAncestor(selector, element = this) {
        // Check if the element exists and is not the document or window
        if (element && element !== document && element !== window) {
            // Try to find the closest element matching the selector
            const closestElement = element.closest(selector);
            if (closestElement) {
                return closestElement;
            }
        }
        // If not found, traverse into the shadow DOM host and search there
        return this.closestAncestor(selector, element.getRootNode().host);
    }
  }
