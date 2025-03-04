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

export default class List {
    _listeners = [];

    _data = new Map();
    _types = new Map();
    _groups = new Map(); // groups of data
    _transformers = new Map([['Number', Number], ['String', String], ['Boolean', Boolean], ['URL', URL]]);

    readOnly = false;

    constructor(data = {}) {
      Object.entries(data).forEach(([key, value]) => this._data.set(key, new Setting(value)));

      return new Proxy(this, {
        set: (settings, key, value) => {
          if (key in settings) return settings[key] = value;
          return settings.set(key, 'value', value);
        },
        get: (settings, key) => {
          if (key in settings) return settings[key];
          return settings.retrieve(key); // NOTE: returning .value
        },
      });

    }

    // PUBLIC

    [Symbol.iterator]() {
      return this._data[Symbol.iterator]();
    }

    /**
     * Registers datatype associated with the specified key.
     * @example
     * settings.types = 'address:URL';
     * @example
     * settings.types = 'active:Boolean age:Number';
     * @example
     * settings.types = [['active','Boolean'], ['age','Number']];
     */
    types(input) {
      if (typeof input === 'string') input = input.split(' ').map(o => o.split(':'));
      for (const [name, type] of input) {
        this._types.set(name, type);
      }
    }

    type(key) {
      return this._types.get(key);
    }

    /**
     * Registers groups associated with the specified keys.
     * @example
     * settings.group('user', 'delay interval');
     * @return {Set<string>} List of members in the group
     */
    group(name, members) {
      if (members) {
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
    retrieve(key) {
      const setting = this.get(key);
      const value = setting ? setting.value : undefined;
      const type = this._types.get(key);
      if (!type) return value;
      const transform = this._transformers.get(type);
      return transform ? transform(value) : value;
    }

    set(key, value) {
      if (this.readOnly) throw new Error("Dataset is read only.");
      let setting = this._data.get(key);
      if (setting) {
        if (setting.value == value) return;
        setting.value = value;
      } else {
        setting = new Setting(value);
        this._data.set(key, setting);
      }
      this.notify(key, value);
      return true;
    }

    get(key) {
      if (this._data.has(key)) {
        return this._data.get(key);
      } else {
        const setting = new Setting();
        this._data.set(key, setting);
        return setting;
      }
    }

    entries() {
      return [...this._data.keys()];
    }
    keys() {
      return [...this._data.keys()];
    }
    values() {
      return [...this._data.values()];
    }
    filter(f){
      return [...this._data].filter(f);
    }

    get snapshot() {
      const entries = [...this._data.entries()].map(([key, setting]) => [key, this.retrieve(key)]);
      return Object.fromEntries(entries);
    }

    subscribe(listener) {
      this._listeners.push(listener);
      this._data.forEach((setting, key) => {
        listener(key, setting.value);
      });
      return () => this.unsubscribe(listener);
    }

    unsubscribe(listener) {
      this._listeners = this._listeners.filter(l => l !== listener);
    }

    // INTERNAL

    notify(key, value) {
      this._listeners.forEach(listener => listener(key, value));
    }

    diagnostics(){ // Built-in Test (BIT) for potential Fault Detection, Isolation, and Recovery (FDIR)
      if (Object.keys(this.snapshot).length !== this._data.size) throw new Error("Snapshot does not reflect all stored data.");
      const testValue = "Test";
      this.set("testKey", testValue);
      if (this.retrieve("testKey") !== testValue) throw new Error("Setting value retrieval mismatch.");
      if (Array.from(this._data.keys()).indexOf("testKey") === -1) throw new Error("Key not stored in data.");
      this.readOnly = true;
      try {
        this.set("readOnlyTest", testValue);
        throw new Error("Setting allowed in readOnly mode.");
      } catch (e) {
        if (e.message !== "Dataset is read only.") throw new Error("Incorrect error message on readOnly check.");
      }
      this.readOnly = false;
      return true;
    }

}
