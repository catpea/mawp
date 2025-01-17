import Command from './Command.js';

// windowCreate -id a
export default class WindowCreate extends Command {

  execute({ id, title='Untitled', reference=null, top=null, left=null, style, active=false }) {
    const scene = this.project.get(this.project.activeLocation.value);

    //console.log('WindowCreate', scene, id, title, reference);


    const component = new this.project.Component(id, 'window');
    component.dataset.set('title', title);
    component.dataset.set('active', active);
    if(reference) component.dataset.set('reference', reference);

    component.dataset.set('left', left);
    component.dataset.set('top', top);
    if(style) component.dataset.set('style', style);

    scene.create(component)

  }

}
