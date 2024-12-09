import EventEmitter from './EventEmitter.js';

export default class Actor extends EventEmitter {
  id;
  #scene;
  #state;

  constructor(state = {}){
    super();
    this.#state = state;
  }

  get scene() { return this.#scene; }
  set scene(v) { this.#scene = v; }

  get state() { return this.#state; }
  set state(v) { this.#state = v; }

  start(v) {
  }

  stop() {
  }

}
