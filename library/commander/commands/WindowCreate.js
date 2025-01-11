import Command from './Command.js';

// windowCreate -id a
export default class WindowCreate extends Command {

  execute({ id, title='Untitled', reference=null, top=0, left=0, style }) {
    const scene = this.project.get(this.project.activeScene.value);

    console.log('WindowCreate', id, title, reference);


    const component = new this.project.Component(id, 'window');
    component.dataset.set('title', title);
    if(reference) component.dataset.set('reference', reference);

    component.dataset.set('left', left);
    component.dataset.set('top', top);
    if(style) component.dataset.set('style', style);

    scene.create(component)

  }

}
