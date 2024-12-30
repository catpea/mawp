export default class Series {
  #value;
  #dependencies = new Map();

  constructor(root, ...transformers) {
    let previousSignal = root;
    for (const transformer of [...transformers, v=>this.value=v]) {
      this.gc = previousSignal.subscribe(v => {
        previousSignal = transformer(v);
      });
    }
  }


  // SIGNAL NATURE
  listeners = [];
  subscribe(listener) {
    this.listeners.push(listener);
    if (this.#value !== undefined) listener(this.#value);
    return () => this.unsubscribe(listener);
  }
  unsubscribe(listener) {
    this.listeners = this.listeners.filter((l) => l !== listener);
    if (this.listeners.length == 0) this.collectGarbage();
  }
  notify() {
    this.listeners.forEach((listener) => listener(this.#value));
  }
  set value(v) {
    if (this.#value == v) return;
    this.#value = v;
    this.notify();
  }
  get value() {
    return this.#value;
  }

  // GARBAGE COLLECTION
  #garbage = [];
  collectGarbage(){
    this.#garbage.map(s=>s.subscription())
  }
  set gc(subscription){ // shorthand for component level garbage collection
    this.#garbage.push( {type:'gc', id:'gc-'+this.#garbage.length, ts:(new Date()).toISOString(), subscription} );
  }
}
