import Signal from 'signal';

import guid from 'guid';
import lol from 'lol';

export default class Forms {

  constructor({ component }) {
    this.component = component;
  }


  buildField(options){

    let container;
    const type = options.type?options.type.value:'text';

    switch(type) {

      case "code-editor":
        container = this.launchModal(options);
        break;

      case "markdown-editor":
        container = this.makeInputElement(options);
        break;

      case "beat-sequencer":
        container = this.makeSelectElement(options)
        break;

      case "beat-sequencer":
        container = this.makeCustomComponent(options)
        break;

      case "Text":
        container = this.makeText(options)
        break;

      case "Setting":
        container = this.makeSettingsList(options)
        break;

      case "Scene":
        container = this.makeSceneList(options)
        break;

      case "beat-sequencer":
        container = this.makeModalForm(options)
        break;

      default:
        container = this.makeInputElement(options);
    }

    return container;
  }

  makeText(configuration){
    let container = lol.div({ type:configuration.type.value, class: 'mb-1'});
      if(configuration.title) container.appendChild(lol.h5({class: 'card-title lead', textContent: configuration.title.value}));
      if(configuration.subtitle) container.appendChild(lol.h6({class: 'card-subtitle mb-3 text-body-secondary', textContent: configuration.subtitle.value}));
      if(configuration.text) container.appendChild(lol.p({class: 'card-text', textContent: configuration.text.value}));
      if(configuration.data) container.appendChild(lol.p({class: 'card-text', textContent: configuration.data.value}));
      if(configuration.subtext) container.appendChild(lol.p({class: 'card-subtext mb-2 text-body-secondary', style:{fontSize: '.72rem'}, textContent: configuration.subtext.value}));
    return container;
  }

  makeSettingsList(conf){
    const { id=guid(), label, name, value, data, type="text", text} = conf;
    const options = new Signal([]); // Format example [ { value:'up', textContent:'Up' } ]
    const enumInput = {
      type: new Signal('Enum'),
      label: new Signal('Setting Name'),
      data: new Signal(),
      name: 'setting',
      options,
    };
    // Populate options with "local variables" or Settings.
    const sceneName = this.component.application.source.activeLocation.value;
    const currentScene = this.component.application.source.get('main-project', sceneName);
    //
    this.gc = currentScene.settings.data.subscribe(v=>{
      const variableNames = Object.keys(v); // Take the names of settings object
      const formOptions = [];
      for( const variableName of variableNames){
        const value = variableName;
        const textContent = variableName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
        const formOption = { value, textContent };
        formOptions.push(formOption);
      }
      // update signal
      options.value = formOptions;
    });
    const element = this.makeInputElement(enumInput);
    return element;
  }


  makeSceneList(conf){
    const { id=guid(), label, name, value, data, type="text", text} = conf;
    const options = new Signal([]); // Format example [ { value:'up', textContent:'Up' } ]
    const enumInput = Object.assign({
      data: new Signal(),
      name: 'setting',
      options,
    }, conf, {type: new Signal('Enum')});
    const activeSceneId = this.component.application.source.activeLocation.value;
    const currentScene = this.component.application.source.get('main-project', activeSceneId);
    const mainProject = this.component.application.source.get('main-project');

    const formOptions = [];
    for( const scene of mainProject.children){
      if(activeSceneId === scene.id) continue;
      const sceneName = scene.settings.get('title').value;
      const formOption = { value: scene.id, textContent:sceneName };
      formOptions.push(formOption);
    }
    options.value = formOptions;
    const element = this.makeInputElement(enumInput);
    return element;
  }



  makeInputElement(configuration){
    const { id=guid(), label, name, value, data, type="text", text} = configuration;

    let container = lol.div({ type, class: 'mb-1'});

    switch(type.value) {

      case "GGG": {

      } break;

      case "Array": {

        const labelElement = lol.label({for: id, class: 'form-label'}, label.value);
        container.appendChild(labelElement);

        const inputElement = lol.input({ type:'text', value: JSON.stringify(data.value), class: 'form-control form-control-sm', id, 'aria-describedby': 'inputHelp', name});
        container.appendChild(inputElement);
        inputElement.addEventListener("input", () => {
          const value = JSON.parse(inputElement.value);
          //console.info(value)
          data.value = value;
        });

        if(text){
          const textElement = lol.div({id:guid(), class: 'form-text'}, text.value);
          container.appendChild(textElement);
        }
      } break;

      case "Boolean": {
        let formCheckContainer = lol.div({ type, class: 'form-check'});

        const inputElement = lol.input({ type:'checkbox', checked: data.value===true , class: 'form-check-input', id, 'aria-describedby': 'inputHelp', name});
        const labelElement = lol.label({for: id, class: 'form-check-label'}, label.value);
        formCheckContainer.appendChild(inputElement);
        formCheckContainer.appendChild(labelElement);
        container.appendChild(formCheckContainer);
        inputElement.addEventListener("input", () => {
          //console.log(inputElement.value)
          data.value =  inputElement.checked;
        });

        if(text){
          const textElement = lol.div({id:guid(), class: 'form-text'}, text.value);
          container.appendChild(textElement);
        }
      } break;

      case "Enum": {
        const {options} = configuration;
        const labelElement = lol.label({for: id, class: 'form-label'}, label.value);
        container.appendChild(labelElement);
        const inputElement = lol.select({id, name, class: 'form-select form-select-sm', id}, ...options.value.map(({value, textContent})=>lol.option({value, textContent, selected:value==data.value})) );
        container.appendChild(inputElement);
        inputElement.addEventListener("input", () => {
          data.value = inputElement.value;
        });

        if(text){
          const textElement = lol.div({id:guid(), class: 'form-text'}, text.value);
          container.appendChild(textElement);
        }
      } break;

      case "Float": {
        const {min, max, step} = configuration;
        const valueElement = lol.small({id:guid(), class: 'small text-muted'});
        data.subscribe(v=>valueElement.textContent = `: ${v}`)
        const labelElement = lol.label({for: id, class: 'form-label'}, label.value, valueElement);
        container.appendChild(labelElement);
        const inputElement = lol.input({ type:'range', style:{width: '20rem'}, /* do not set value here, use .value */  min:min.value, max:max.value, step:step.value, class: 'form-range form-range-sm d-block', id, 'aria-describedby': 'inputHelp', name});
        container.appendChild(inputElement);
        inputElement.value = data.value;
        inputElement.addEventListener("input", () => {
          data.value =  inputElement.valueAsNumber ;
          //console.log(data.value)
        });

        if(text){
          const textElement = lol.div({id:guid(), class: 'form-text'}, text.value);
          container.appendChild(textElement);
        }
      } break;

      case "Input": {
        const labelElement = lol.label({for: id, class: 'form-label'}, label.value);
        container.appendChild(labelElement);
        const inputElement = lol.input({ type:type.value, value:data.value, class: 'form-control form-control-sm', id, 'aria-describedby': 'inputHelp', name});
        container.appendChild(inputElement);
        inputElement.addEventListener("input", () => {
          // inputElement.setCustomValidity("");
          // inputElement.checkValidity();
          data.value = inputElement.value;
        });
        if(text){
          const textElement = lol.div({id:guid(), class: 'form-text'}, text.value);
          container.appendChild(textElement);
        }
       } break;

      case "Textarea": {
        const labelElement = lol.label({for: id, class: 'form-label'}, label.value);
        container.appendChild(labelElement);
        const inputElement = lol.textarea({ class: 'form-control form-control-sm', id, rows: configuration.rows?.value, 'aria-describedby': 'inputHelp', name}, data.value );
        container.appendChild(inputElement);
        inputElement.addEventListener("input", () => {
          // inputElement.setCustomValidity("");
          // inputElement.checkValidity();
          data.value = inputElement.value;
        });
        if(text){
          const textElement = lol.div({id:guid(), class: 'form-text'}, text.value);
          container.appendChild(textElement);
        }
      } break;

      default:
        const problematic = type.value?`Unrecognized (${type.value})`:'Undefined';
        const alertIcon = lol.i({class: 'bi bi-exclamation-triangle me-2'});
        const alertMessage = lol.div({class: 'alert alert-dark px-2 py-1'}, alertIcon, `${problematic} Form Field Type`);
        container.appendChild(alertMessage);
    }




    // const valueElement = lol.small({id:guid(), class: 'small text-muted'});
    // container.appendChild(valueElement);
    // data.subscribe(v=>valueElement.textContent = `Current value = ${v}`)

    return container;
  }

  makeSelectElement(options){

  }

  makeCustomComponent(options){

  }

  makeModalForm(options){

  }











  createHidden({id, name, value}){
    if (!id) id = guid();
    const element = lol.input({ type: 'hidden', class: 'form-control', name, value });
    return element;
  }

  createFloatingInput({ id, name, value, type="text", formText}){
    if (!id) id = guid();
    const container = lol.div({ type, class: 'form-floating mb-3', style: {fontSize: '.72rem'} },
      // NOTE: order is significant input before label
      lol.input({ type, class: 'form-control', id, 'aria-describedby': 'inputHelp', name, value, placeholder:name, style: {fontSize: '.72rem', }}),
      lol.label({for: id}, name),
    );
    return container;
  }

  createCompactInput({ id, name, value, type="text", formText}){
    if (!id) id = guid();
    const container = lol.div({ type, class: 'mb-1 row', style: {fontSize: '.72rem'} },
      lol.label({for: id, class: 'col-5 col-form-label text-truncate text-end'}, name),
      lol.div({class:'col-7'},
        lol.input({ type, class: 'form-control form-control-sm', id, name, value, placeholder:name, style: {fontSize: '.72rem', }}),
      ),
    );
    return container;
  }

  createInput({ id, name, value, type="text", formText}){
    if (!id) id = guid();
    const container = lol.div({ type, class: 'mb-3'},
      lol.label({for: id, class: 'form-label'}, name),
      lol.input({ type, class: 'form-control-sm', id, 'aria-describedby': 'inputHelp', name}),
      formText?lol.div({id:guid(), class: 'form-text'}, formText):null,
    );
    return container;
  }






  // PHASE 1: input, fast and raw









  // PAHSE 2: view and edit + save button









  // PHASE 3: Modal, proper forms

}
