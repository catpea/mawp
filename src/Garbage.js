export default class Garbage {

  #subscriptions = [];
  destroy() {
    this.#subscriptions.map(s => s.subscription())
  }
  set gc(subscription) { // shorthand for component level garbage collection
    if (! subscription instanceof Function) throw new Error('gc accepts functions to be executed at destroy() only');
    this.#subscriptions.push({ type: 'gc-standard', id: 'gc-' + this.#subscriptions.length, subscription });
  }

}
