import guid from 'guid';
import Command from './Command.js';

// windowCreate -id hello -reference upper; windowCreate -id world -reference upper; pipeCreate -from hello:out -to world:in
// windowCreate -id hello -reference upper -left 300 -top 35; windowCreate -id world -reference upper -left 600 -top 35; pipeCreate -from hello:out -to world:in
export default class PipeCreate extends Command {

  execute({ id=guid(), from, to }) {
    const scene = this.getLocation()
    const pipe = scene.createConnection(from, to);
    pipe.start();
  }

}
