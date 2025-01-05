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

      // const application = this.parentNode.parentNode.host.closest(`x-application`);
      const application = this.transcend(`x-application`);
      if(!application) throw new Error('Unable to locate applicaion!')


       const debounceDelay = 300;
       const executedCommandTimeouts = new Map();
       this.gc = application.project.commander.on('executed', o => {
         if (executedCommandTimeouts.has(o.commandName)) {
           clearTimeout(executedCommandTimeouts.get(o.commandName));
         }
         const timeoutId = setTimeout(() => {
            this.publishExecutedCommand(o);
            executedCommandTimeouts.delete(o.commandName);
          }, debounceDelay);
          executedCommandTimeouts.set(o.commandName, timeoutId);
       });

      this.status.value = 'ready';
    }






    publishExecutedCommand(executedCommandEvent){

      const forms = new Forms({gc: this.gc});

      const selfDestruct = 15_000;
      const commandForm = lol.form({});

      const commandContainer = lol.div({ class: 'card card-dark mb-3' },
        lol.div({ class: 'card-body' },
          commandForm
        ),
      );

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

      commandForm.appendChild( lol.button({ class: 'btn btn-dark btn-sm position-absolute top-0 end-0', on: {click: ()=>commandContainer.remove()} }, lol.i({class:'bi bi-x-lg'})))
      commandForm.appendChild( lol.legend({ class:'fs-6 pb-0 mb-0'},`command: ${executedCommandEvent.commandName}`))
      commandForm.appendChild( lol.small({ class:'opacity-25 mb-3 d-block'}, executedCommandEvent.timestamp))
      commandForm.appendChild(forms.createHidden({name: 'commandName', value:executedCommandEvent.commandName}))

      for (const [name, value] of Object.entries(executedCommandEvent.commandArguments[0])) {
        commandForm.appendChild(forms.createCompactInput({name, value}))
      }

      commandForm.appendChild(lol.button({class:'btn btn-outline-secondary btn-sm float-end'}, 'Adjust'))

      const progressBar = lol.div({ class: 'progress-bar', style: {width: '100%'} },)
      let progressBarWidth = 100;
      const progressBarWidthIntervalId = setInterval(() => {
        progressBarWidth = progressBarWidth - 1;
        progressBar.style.width = progressBarWidth + '%';
        if (progressBarWidth < 0){
          clearInterval(progressBarWidthIntervalId);
          commandContainer.remove()
        }
      }, selfDestruct / 100);

      commandForm.addEventListener("mouseover", function (e) {
        clearInterval(progressBarWidthIntervalId);
        progressBar.style.display = 'none';
      });

      commandContainer.appendChild(lol.div({ class: 'progress position-absolute top-100 start-50 translate-middle', style: {marginTop: '-1px', height:'1px', width: '98%', background:'transparent'} }, progressBar) )

      const consoleContainer = this.shadowRoot.querySelector('.console');
      consoleContainer.insertBefore(commandContainer, consoleContainer.firstChild);
   };










    transcend(selector, element = this) {
        // Check if the element exists and is not the document or window
        if (element && element !== document && element !== window) {
            // Try to find the closest element matching the selector
            const closestElement = element.closest(selector);

            if (closestElement) {
                return closestElement;
            }

        }

        // If not found, traverse into the shadow DOM host and search there
        return this.transcend(selector, element.getRootNode().host);
    }
  }
