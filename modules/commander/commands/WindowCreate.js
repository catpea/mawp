import guid from 'guid';
import Command from './Command.js';

// windowCreate -id a
export default class WindowCreate extends Command {

  async execute({ id=guid(), title='Untitled', reference=null, top=null, left=null, style, active=false, agent='@core/standard-agent' }) {
    const scene = this.project.get(this.project.activeLocation.value);
    const Agent = await this.project.getAgent(agent);
    const component = scene.createComponent(id, {title, reference, left, top, style, active }, new Agent());
    await component.state.initialize();
    await component.state.start();
  }

}
