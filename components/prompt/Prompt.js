import Signal from 'signal';
import commando from 'commando';
import lol from 'lol';
import transcend from 'transcend';

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
          padding-right: 2rem;

          i.prompt-send {
            position: absolute;
            right: 1rem;
            top: .49rem;

            &:hover::before {
              border: 1px solid rgba(220,220,220,.2);
            }

            &::before {
              border-radius: 4px;
              padding: 4px;
              border: 1px solid rgba(0,0,0,.2);

            }
          }

          button.prompt-send {
            position: absolute;
            right: 1rem;
            top: .32rem;
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



    }

    connectedCallback() {


      const application = transcend(this, `x-application`);
      if(!application) throw new Error('Unable to locate applicaion!')


      let commandForm;

      const executeForm = async ()=>{
        const formData = new FormData(commandForm);
        const commandLine = formData.get('commandLine');

        console.warn('commando(commandLine)', commando(commandLine));

        for( const { commandName, commandArguments } of commando(commandLine)){
          await application.project.commander[commandName](commandArguments);
        }
      }
      const commandProcessor = e => {
        e.preventDefault();
        executeForm()
      };

      const testCommand = 'windowMove -id windowPostMessage -left 10 -top 70 --note "Bork Bork"; windowMove -id uppercaseOutput -left 500 -top 700; windowCreate -id hello -reference upper -left 300 -top 35; windowCreate -id world -left 600 -top 35 -style solid-success; pipeCreate -from hello:out -to world:in'
      const commandLine = lol.input({type:'text', class:'prompt-control', name:'commandLine', value: testCommand});
      const submitIcon = lol.i({class:'prompt-send bi bi-send-fill', on:{click:()=>executeForm()} })
      commandForm = lol.form({on:{submit:commandProcessor}}, commandLine, submitIcon);
      const container = lol.div({ class: 'prompt', }, commandForm);

      this.shadowRoot.appendChild(container);

      setTimeout(()=>{
        const commandLine = `alert --type info --ttl 60 --title "Hello!" --text "Command line is working now. Just hit enter (when in there) to execute, or click send icon." --note "Click arrow-icons in window captions to move between scenes. You can now close, and move windows. Selecting/deleting lines is now supported." `;
        for( const { commandName, commandArguments } of commando(commandLine)){
          //console.log(commandName, commandArguments);
          application.project.commander[commandName](commandArguments);
        }
      }, 1_000)

      this.status.value = 'ready';




    }

  }
