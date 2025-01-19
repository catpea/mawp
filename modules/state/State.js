class Value {
  #value;
  listeners;
  constructor(value) {
    this.#value = value;
    this.listeners = [];
  }
  subscribe(listener) {
    this.listeners.push(listener);
    if (this.#value !== undefined) listener(this.#value);
    return () => this.unsubscribe(listener);
  }
  unsubscribe(listener) {
    this.listeners = this.listeners.filter((l) => l !== listener);
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
}

export default class State {
  #snapshots = [];
  #currentState;

  constructor(initialState = {}) {
    this.#snapshots.push(JSON.stringify(initialState));
    this.#currentState = initialState;
    this.listeners = [];

    return new Proxy(this, {
      set: (settings, key, value, proxy) => {
        settings.set(key, value);
      },
      get: (settings, key, value, proxy) => {
        if (key in settings) return settings[key];
        return settings.get( key ).value; //NOTE: returning .value
      },
    });

  }

  // PUBLIC

  get state(){
    return this.#currentState;
  }

  set(key, value) {
    if (key in this.#currentState) {
      if (this.#currentState[key].value == value) return;
      this.#currentState[key].value = value;
    } else {
      this.#currentState[key] = new Value(value);
    }
    this.#notify(key, value);
    return this.#currentState[key];
  }

  get(key) {
    if (key in this.#currentState) {
      return this.#currentState[key];
    } else {
      this.#currentState[key] = new Value();
      return this.#currentState[key];
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
    for (const [key, value] of Object.entries(this.#currentState)) {
      listener(key, value.value); // NOTE: we are storing signals here
    }
    return () => this.unsubscribe(listener);
  }

  unsubscribe(listener) {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  snapshot(){
    this.#snapshots.push(JSON.stringify(this.#currentState));
  }
  reset(){
    this.#currentState = JSON.parse(this.#snapshots[0]);
    this.#snapshots.splice(1);
  }
  undo(){
    this.#currentState = JSON.parse(this.#snapshots.pop());
  }

  // INTERNAL

  #notify(key, value) {
    //NOTE: notify sends in its own value which is not a signal
    this.listeners.forEach((listener) => listener(key, value));
  }
}
