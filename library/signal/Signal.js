export default class Signal {
  #value;
  #subscribers = [];

 // using Map as it remembers the original insertion order of the keys,
 // and objects may be used as key
  #dependencies = new Map();

  constructor(value) {
    this.#value = value;
  }

  subscribe(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function.');
    }

    // resubscribeToAllDependencies checks for null subscribers it can be called here
    if (this.#subscribers.length == 0) this.resubscribeToAllDependencies();

    this.#subscribers.push(callback);

    // IMMEDIATE CALLBACK ONLY IF NON UNDEFIED EXIST
    if (this.#dependencies.size) {
      const allValues = [this.#value, ...Array.from(this.#dependencies.keys()).map(o => o.value)];
      const allUndefined = allValues.every(v => v === undefined);
      if (!allUndefined) callback(...allValues);
    } else {
      // if no other dependencites at this time
      if (this.#value !== undefined) callback(this.#value);
    }



    // Return an unsubscribe function for convenience
    return () => this.unsubscribe(callback);
  }

  unsubscribe(callback) {
    const index = this.#subscribers.indexOf(callback);

    if (index > -1) {
      this.#subscribers.splice(index, 1);
    }
    if (this.#subscribers.length == 0) this.unsubscribeFromAllDependencies();
  }

  notify() {
    this.#subscribers.forEach(callback => {
      try {
        const dependencyValues = Array.from(this.#dependencies.keys()).map(o => o.value);
        callback(this.#value, ...dependencyValues);
      } catch (error) {
        console.error('Error executing subscriber callback:', error);
      }
    });
  }

  // READ
  get value() { return this.get() }
  set value(v) { this.set(v) }

  get() {
    return this.#value;
  }

  // WRITE

  set(value) {
    let hasChanged;

    const oldValue = this.#value;
    const newValue = value;

    if (this.isPrimitive(oldValue) && this.isPrimitive(newValue)) {
      hasChanged = oldValue !== newValue;
    } else {
      hasChanged = !this.deepEqual(oldValue, newValue);
    }

    if(hasChanged){
      this.#value = newValue;
      this.notify();
    }
  }

  update(f) { // convenience method
    const newValue = f( this.#value );
    if (newValue === undefined) {
      throw new Error('Signal update result must return a new value');
    }

    // CHECK IF THE NEW VALUE IS OF THE SAME TYPE
    const oldType = this.getType(this.#value);
    const newType = this.getType(newValue);

    if (oldType !== newType) {
      throw new Error('Signal update result must be of the same type as the current value');
    }

    // Pass it on to set as usual
    this.set(newValue);
  }

  // DEPENDENCY SYSTEM

  addDependency(...dependencies) {
    for (const dependency of dependencies) {
      const unsubscribe = dependency.subscribe(() => this.notify());
      this.#dependencies.set(dependency, unsubscribe);
    }
  }

  removeDependency(dependency) {
    const unsubscribe = this.#dependencies.get(dependency);
    unsubscribe();
    this.#dependencies.delete(dependency);
  }

  unsubscribeFromAllDependencies() {
    for (const [dependency, unsubscribe] of this.#dependencies) {
      unsubscribe();
      this.#dependencies.set(dependency, null);
    }
  }
  resubscribeToAllDependencies() {
    for (const [dependency, subscription] of this.#dependencies) {
      if(subscription === null){
        const unsubscribe = dependency.subscribe(() => this.notify());
        this.#dependencies.set(dependency, unsubscribe);
      }
    }
  }

  removeAllDependencies() {
    for (const [dependency, unsubscribe] of this.#dependencies) {
      unsubscribe();
      this.#dependencies.delete(dependency);
    }
  }

  // HACKS & TRICKERY

  [Symbol.iterator]() {
    return this.#value[Symbol.iterator]();
  }

  // UTILITY FUNCTIONS

  isPrimitive(value) {
    return value === null || (typeof value !== 'object' && typeof value !== 'function');
  }

  deepEqual(a, b, visited = new Set()) {
    // Check for strict equality first
    if (a === b) {
      return true;
    }

    // If either value is primitive, they are not equal (since !==)
    if (this.isPrimitive(a) || this.isPrimitive(b)) {
      return false;
    }

    // Handle cyclic references
    if (visited.has(a)) {
      return true; // Assume cyclic structures are equal
    }
    visited.add(a);

    // Ensure both are of the same type
    if (Object.prototype.toString.call(a) !== Object.prototype.toString.call(b)) {
      return false;
    }

    // Compare arrays
    if (Array.isArray(a)) {
      if (a.length !== b.length) {
        return false;
      }

      for (let i = 0; i < a.length; i++) {
        if (!this.deepEqual(a[i], b[i], visited)) {
          return false;
        }
      }

      return true;
    }

    // Compare objects
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    // Check for different number of keys
    if (keysA.length !== keysB.length) {
      return false;
    }

    // Check if all keys and values are equal
    for (let key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) {
        return false;
      }
      if (!this.deepEqual(a[key], b[key], visited)) {
        return false;
      }
    }

    return true;
  }

  getType(value) {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  }

  static wrap(value) {
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        // If it's an array, map over it and wrap each element
        return value.map(this.wrap);
      } else {
        // If it's an object, recursively wrap each property
        const wrappedObject = {};
        for (const key in value) {
          if (value.hasOwnProperty(key)) {
            wrappedObject[key] = this.wrap(value[key]);
          }
        }
        return wrappedObject;
      }
    } else {
      // If it's a primitive value, wrap it in a Signal
      return new Signal(value);
    }
  }

}
