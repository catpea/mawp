import Actor from './Actor.js';

export default class Pipe extends Actor {
  constructor(state){
    super(state);
    this.gc = this.on('scene:start', v => this.start(v));
  }

  connect(from, to) {
    const [fromProgramId, fromPortId] = (from||this.state.from).split(':');
    const [toProgramId,toPortId] = (to||this.state.to).split(':');
    this.scene.getActor(fromProgramId).on(fromPortId, v=>this.scene.getActor(toProgramId).send(toPortId, v))
  }

  start(v) {
    console.log(`Actor Pipe starting with: `, v);
  }

  stop() {
    this.destroy();
  }



}
