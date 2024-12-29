class ValueSignal {
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

export default class SysDataset {
  data;
  constructor(data = {}) {
     this.data = data;
     this.listeners = [];
   }
   set(key, value) {
     if (key in this.data) {
       if (this.data[key].value == value) return;
       this.data[key].value = value;
     }else{
       this.data[key] = new ValueSignal(value);
     }
     this.notify(key, value)
     return this.data[key];
   }
   get(key) {
     if (key in this.data) {
       return this.data[key];
     }else{
       this.data[key] = new ValueSignal();
       return this.data[key];
     }
   }
   subscribe(listener) {
     this.listeners.push(listener);
     for (const [key, value] of Object.entries(this.data)) {
       listener(key, value.value); // NOTE: we are storing signals here
     }
     return () => this.unsubscribe(listener);
   }
   unsubscribe(listener) {
     this.listeners = this.listeners.filter((l) => l !== listener);
   }
   notify(key, value) { //NOTE: notify sends in its own value which is not a signal
     this.listeners.forEach((listener) => listener(key, value));
   }
}
