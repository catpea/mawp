import Actor from './Actor.js';

export default class Worker extends Actor {
  constructor(state){
    super(state);
    this.gc = this.on('input', v => this.processor(v, this.state));
    this.gc = this.on('upgrade', v =>  this.processor = v );
    this.gc = this.on('scene:start', v => this.start(v));
  }

  processor(input, state) {
    this.send('output', v)
  }

  start(v) {
    console.log(`Actor Worker starting with: `, v);
  }

  stop() {
    this.destroy();
  }



}
