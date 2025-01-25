import Signal from 'signal';
import Forms from 'forms';

import lol from 'lol';
import transcend from 'transcend';

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
         	width: 20vw;
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
      const application = transcend(this, `x-application`);
      if(!application) throw new Error('Unable to locate applicaion!')

       this.gc = application.source.commander.on('alert', o => {
            this.publishAlert(o);
       });

       const debounceDelay = 300;
       const executedCommandTimeouts = new Map();
       this.gc = application.source.commander.on('executed', o => {

         let commandId = o.commandName;
         if(o.commandArguments && o.commandArguments.id) commandId = o.commandName + o.commandArguments.id
         console.info(commandId)
         if (executedCommandTimeouts.has(commandId)) {
           clearTimeout(executedCommandTimeouts.get(commandId));
         }
         const timeoutId = setTimeout(() => {
            this.publishExecutedCommand(o);
            executedCommandTimeouts.delete(commandId);
          }, debounceDelay);
          executedCommandTimeouts.set(commandId, timeoutId);
       });

      this.status.value = 'ready';
    }




    publishAlert(alert){
      const application = transcend(this, `x-application`);
      if(!application) throw new Error('Unable to locate applicaion!')
      const selfDestruct = alert.ttl*1000 || 30_000;
      const alertContainer = lol.div({ class: `alert alert-${alert.type||'primary'} mb-3` });
      alertContainer.appendChild( lol.button({ class: `btn btn-link btn-sm position-absolute top-0 end-0`, on: {click: ()=>alertContainer.remove()} }, lol.i({class:'bi bi-x-lg'})))

      if(alert.title) alertContainer.appendChild(lol.h4({},alert.title));
      if(alert.text) alertContainer.appendChild(lol.p({},alert.text));
      if(alert.note){
       alertContainer.appendChild(lol.hr());
       alertContainer.appendChild(lol.small({},alert.note));
      }

      const progressBar = lol.div({ class: 'progress-bar opacity-25', style: {width: '100%'} },)
      let progressBarWidth = 100;
      const progressBarWidthIntervalId = setInterval(() => {
        progressBarWidth = progressBarWidth - 1;
        progressBar.style.width = progressBarWidth + '%';
        if (progressBarWidth < 0){
          clearInterval(progressBarWidthIntervalId);
          alertContainer.remove()
        }
      }, selfDestruct / 100);
      alertContainer.addEventListener("mouseover", function (e) {
        clearInterval(progressBarWidthIntervalId);
        progressBar.style.display = 'none';
      });
      alertContainer.appendChild(lol.div({ class: 'progress position-absolute top-100 start-50 translate-middle', style: {  marginTop: '-6px', height:'1px', width: '98%', background:'transparent'} }, progressBar) )

      const consoleContainer = this.shadowRoot.querySelector('.console');
      consoleContainer.insertBefore(alertContainer, consoleContainer.firstChild);
    }

    publishExecutedCommand(executedCommandEvent){
      const application = transcend(this, `x-application`);
      if(!application) throw new Error('Unable to locate applicaion!')

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
        application.source.commander[commandName](commandAttributes);
        commandContainer.remove()
      });

      commandForm.appendChild( lol.button({ class: 'btn btn-dark btn-sm position-absolute top-0 end-0', on: {click: ()=>commandContainer.remove()} }, lol.i({class:'bi bi-x-lg'})))
      commandForm.appendChild( lol.legend({ class:'fs-6 pb-0 mb-0'},`command: ${executedCommandEvent.commandName}`))
      commandForm.appendChild( lol.small({ class:'opacity-25 mb-3 d-block'}, executedCommandEvent.timestamp))
      commandForm.appendChild(forms.createHidden({name: 'commandName', value:executedCommandEvent.commandName}))

      for (const [name, value] of Object.entries(executedCommandEvent.commandArguments)) {
        commandForm.appendChild(forms.createCompactInput({name, value}))
      }

      commandForm.appendChild(lol.button({class:'btn btn-outline-secondary btn-sm float-end'}, 'Adjust'))

      const progressBar = lol.div({ class: 'progress-bar opacity-25', style: {width: '100%'} },)
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

      commandContainer.appendChild(lol.div({ class: 'progress position-absolute top-100 start-50 translate-middle', style: {  marginTop: '-6px', height:'1px', width: '98%', background:'transparent'} }, progressBar) )

      const consoleContainer = this.shadowRoot.querySelector('.console');
      consoleContainer.insertBefore(commandContainer, consoleContainer.firstChild);
   };











  }
