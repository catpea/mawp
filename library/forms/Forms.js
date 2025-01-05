import guid from 'guid';
import lol from 'lol';

export default class Forms {

  constructor({ gc }) {
    this.gc = gc;
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
      lol.label({for: id, class: 'col-sm-2 col-form-label'}, name),
      lol.div({class:'col-sm-10'},
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

}
