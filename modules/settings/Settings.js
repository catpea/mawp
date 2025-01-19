class Setting {
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

export default class Settings {

  _data;
  _types = new Map();
  _groups = new Map();
  _transformers = new Map([['Number',Number], ['String',String], ['Boolean',Boolean], ['URL',URL]]);

  readOnly = false;

  constructor(data = {}) {
    this._data = data;
    this.listeners = [];

    return new Proxy(this, {
      set: (settings, key, value, proxy) => {
        return settings.set(key, value);
      },
      get: (settings, key, value, proxy) => {
        if (key in settings) return settings[key];
        return settings.retrieve( key ); //NOTE: returning .value
      },
    });

  }

  // PUBLIC

  /**
   * Registers datatype sassociated with the specified key.
   * @example
   * settings.types = 'address:URL';
   * @example
   * settings.types = 'active:Boolean age:Number';
   * @example
   * settings.types = [['active','Boolean], ['age'],[Number]];
   */
  types(input){
    console.log( 'XXXX set types', input);

    if (typeof input === 'string') input = input.split(' ').map(o=>o.split(':')) //.map(([name, type])=>[type,this.#transformers[type]?this.#transformers[type]:null])); // convert 'a:string b:number' to [['a',String],['b',Number]]
  console.log( 'XXXX set types 2', input);

    for( const [name, type] of input ) {
      console.log( 'XXXX FOR set types', name, type);

      this._types.set(name, type);
    }
  }
  type(key){
    console.log(this._types, key, this._types.get(key));
    return this._types.get(key);
  }
  /**
   * Registers groups associated with the specified keys.
   * @example
   * settings.group('user', 'delay interval');
   * @return {Set<string>} List of members in the group
   */
  group(name, members){

    if(members){ // INITIALIZE WRITER
      if (typeof members === 'string') members = members.split(' ');
      const group = new Set(members);
      this._groups.set(name, group);
    }

    return this._groups.get(name) || [];
  }

  /**
   * Retrieves the value associated with the specified key, applying type transformations if specified.
   * @param {string} key - The key of the setting to retrieve.
   * @returns {*} The value of the setting, possibly transformed according to its type.
   */
  retrieve(key){
    const value = this.get(key).value;

    const type = this._types.get(key);
    console.info('XXXXXX retrieve type =', type, )
    if(!type) return value;
    const transform = this._transformers.get(type);
    console.info('XXXXXX retrieve transform', transform)
    if(!transform) return value;

    console.info('XXXXXX retrieve', type, transform, transform(value), key,  value)

    return transform(value);
  }

  set(key, value) {
    if (this.readOnly) throw new Error("Dataset is read only.");
    if (key in this._data) {
      if (this._data[key].value == value) return;
      this._data[key].value = value;
    } else {
      this._data[key] = new Setting(value);
    }
    this.notify(key, value);
    return true;
  }

  get(key) {
    if (key in this._data) {
      return this._data[key];
    } else {
      this._data[key] = new Setting();
      return this._data[key];
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
    for (const [key, value] of Object.entries(this._data)) {
      listener(key, value.value); // NOTE: we are storing signals here
    }
    return () => this.unsubscribe(listener);
  }

  unsubscribe(listener) {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  // INTERNAL

  notify(key, value) {
    //NOTE: notify sends in its own value which is not a signal
    this.listeners.forEach((listener) => listener(key, value));
  }
}
