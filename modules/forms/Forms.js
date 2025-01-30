import guid from 'guid';
import lol from 'lol';

export default class Forms {

  constructor({ gc }) {
    this.gc = gc;
  }


  buildField(options){

    let container;

    switch(options.type) {

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

      case "beat-sequencer":
        container = this.makeModalForm(options)
        break;

      default:
        container = this.makeInputElement(options);
    }

    return container;
  }

  makeInputElement(configuration){
    const { id=guid(), label, name, value, data, type="text", text} = configuration;

    let container = lol.div({ type, class: 'mb-1'});

    switch(type.value) {

      case "Text": {


        const labelElement = lol.label({for: id, class: 'me-1'}, label.value + ':');
        container.appendChild(labelElement);

        const textElement = lol.small({ type:'text', textContent: JSON.stringify(data.value)});
        container.appendChild(textElement);

      } break;

      case "Array": {

        const labelElement = lol.label({for: id, class: 'form-label'}, label.value);
        container.appendChild(labelElement);

        const inputElement = lol.input({ type:'text', value: JSON.stringify(data.value), class: 'form-control form-control-sm', id, 'aria-describedby': 'inputHelp', name});
        container.appendChild(inputElement);
        inputElement.addEventListener("input", () => {
          const value = JSON.parse(inputElement.value);
          console.info(value)
          data.value = value;
        });
      } break;

      case "Boolean": {
        let formCheckContainer = lol.div({ type, class: 'form-check'});

        const inputElement = lol.input({ type:'checkbox', checked: data.value===true , class: 'form-check-input', id, 'aria-describedby': 'inputHelp', name});
        const labelElement = lol.label({for: id, class: 'form-check-label'}, label.value);
        formCheckContainer.appendChild(inputElement);
        formCheckContainer.appendChild(labelElement);
        container.appendChild(formCheckContainer);
        inputElement.addEventListener("input", () => {
          console.log(inputElement.value)
          data.value =  inputElement.checked;
        });
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
          console.log(data.value)
        });
      } break;

      case "Apple":
        text = "How you like them apples?";
        break;

      default:
        const labelElement = lol.label({for: id, class: 'form-label'}, label.value);
        container.appendChild(labelElement);
        const inputElement = lol.input({ type:type.value, value:data.value, class: 'form-control form-control-sm', id, 'aria-describedby': 'inputHelp', name});
        container.appendChild(inputElement);
        inputElement.addEventListener("input", () => {
          // inputElement.setCustomValidity("");
          // inputElement.checkValidity();
          data.value = inputElement.value;
        });
    }


    if(text){
      const textElement = lol.div({id:guid(), class: 'form-text'}, text.value);
      container.appendChild(textElement);
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
