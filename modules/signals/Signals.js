class Signal {
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

// class Signals_OLD {
//   constructor(initialData = {}) {
//     this.data = new Signal({});
//     if (Object.keys(initialData).length > 0) {
//       this.merge(initialData);
//     }
//   }

//   lookup(path) {
//     if (!path) return { object: this.data, property: 'value' };

//     const segments = path.split(".");
//     let current = this.data;

//     // Navigate through the path, creating signals as needed
//     for (let i = 0; i < segments.length - 1; i++) {
//       const segment = segments[i];
//       if (!current.value[segment] || !(current.value[segment] instanceof Signal)) {
//         current.value[segment] = new Signal({});
//       }
//       current = current.value[segment];
//     }

//     return {
//       object: current,
//       property: segments[segments.length - 1]
//     };
//   }

//   set(path, value) {
//     const { object, property } = this.lookup(path);
//     if (!object.value[property] || !(object.value[property] instanceof Signal)) {
//       object.value[property] = new Signal(value);
//     } else {
//       object.value[property].value = value;
//     }
//   }

//   get(path) {
//     const { object, property } = this.lookup(path);
//     if (!object.value[property]) return undefined;
//     return object.value[property] instanceof Signal ?
//       object.value[property].value :
//       object.value[property];
//   }

//   has(path) {
//     const { object, property } = this.lookup(path);
//     return object.value.hasOwnProperty(property);
//   }

//   delete(path) {
//     const { object, property } = this.lookup(path);
//     if (object.value && object.value.hasOwnProperty(property)) {
//       delete object.value[property];
//     }
//   }

//   merge(path, patch = {}) {
//     if (typeof path === 'object') {
//       patch = path;
//       path = '';
//     }

//     const { object, property } = this.lookup(path);

//     // If we're at root level
//     if (!path) {
//       Object.entries(patch).forEach(([key, value]) => {
//         this.set(key, value);
//       });
//       return;
//     }

//     // If the property doesn't exist or isn't a Signal, create it
//     if (!object.value[property] || !(object.value[property] instanceof Signal)) {
//       object.value[property] = new Signal({});
//     }

//     // Merge the patch with existing values
//     const currentValue = object.value[property].value;
//     object.value[property].value = { ...currentValue, ...patch };
//   }

//   // Comprehensive diagnostics method
//   static diagnostics() {
//     console.log("Running Signals Diagnostics...");
//     const signals = new Signals();

//     // Test basic set and get
//     signals.set("test", 123);
//     console.assert(signals.get("test") === 123, "Basic set/get failed");

//     // Test nested set and get
//     signals.set("nested.value", 456);
//     console.assert(signals.get("nested.value") === 456, "Nested set/get failed");

//     // Test deep nesting
//     signals.set("deep.nesting.test", "deep");
//     console.assert(signals.get("deep.nesting.test") === "deep", "Deep nesting failed");

//     // Test has method
//     console.assert(signals.has("test"), "Has method failed for existing path");
//     console.assert(!signals.has("nonexistent"), "Has method failed for non-existing path");

//     // Test delete method
//     signals.delete("test");
//     console.assert(!signals.has("test"), "Delete method failed");

//     // Test merge at root
//     signals.merge({ a: 1, b: 2 });
//     console.assert(signals.get("a") === 1 && signals.get("b") === 2, "Root merge failed");

//     // Test merge at path
//     signals.merge("nested", { x: 10, y: 20 });
//     console.assert(signals.get("nested.x") === 10 && signals.get("nested.y") === 20, "Path merge failed");

//     // Test signal value getter
//     const nestedSignal = signals.lookup("nested").object;
//     console.assert(nestedSignal instanceof Signal, "Signal instantiation failed");
//     console.assert(typeof nestedSignal.value === "object", "Signal value getter failed");

//     console.log("Diagnostics completed successfully!");
//     return true;
//   }
// }


export default class Signals {
  constructor(initialData = {}) {
    this.data = new Signal({});
    if (Object.keys(initialData).length > 0) {
      this.merge(initialData);
    }
  }

  lookup(path) {
    if (!path) return { object: this.data, property: 'value' };

    const segments = path.split(".");
    let current = this.data;

    // Navigate through the path, creating signals as needed
    for (let i = 0; i < segments.length - 1; i++) {
      const segment = segments[i];
      if (!current.value[segment] || !(current.value[segment] instanceof Signal)) {
        current.value[segment] = new Signal({});
      }
      current = current.value[segment];
    }

    return {
      object: current,
      property: segments[segments.length - 1]
    };
  }

  set(path, value) {
    const { object, property } = this.lookup(path);
    if (!object.value[property] || !(object.value[property] instanceof Signal)) {
      object.value[property] = new Signal(value);
    } else {
      object.value[property].value = value;
    }
  }

  get(path) {
    const { object, property } = this.lookup(path);
    if (!object.value[property]) return undefined;
    return object.value[property] instanceof Signal ?
      object.value[property].value :
      object.value[property];
  }

  has(path) {
    const { object, property } = this.lookup(path);
    return object.value.hasOwnProperty(property);
  }

  delete(path) {
    const { object, property } = this.lookup(path);
    if (object.value && object.value.hasOwnProperty(property)) {
      delete object.value[property];
    }
  }

  merge(path, patch = {}) {
    if (typeof path === 'object') {
      patch = path;
      path = '';
    }

    const { object, property } = this.lookup(path);

    // If we're at root level
    if (!path) {
      Object.entries(patch).forEach(([key, value]) => {
        this.set(key, value);
      });
      return;
    }

    // If the property doesn't exist or isn't a Signal, create it
    if (!object.value[property] || !(object.value[property] instanceof Signal)) {
      object.value[property] = new Signal({});
    }

    // Merge the patch with existing values
    const currentValue = object.value[property].value;
    object.value[property].value = { ...currentValue, ...patch };
  }

  entries() {
    const result = [];

    const collectEntries = (obj, prefix = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = prefix ? `${prefix}.${key}` : key;

        if (value instanceof Signal) {
          if (typeof value.value === 'object' && value.value !== null && !(value.value instanceof Signal)) {
            collectEntries(value.value, currentPath);
          } else {
            result.push([currentPath, value.value]);
          }
        } else if (typeof value === 'object' && value !== null) {
          collectEntries(value, currentPath);
        } else {
          result.push([currentPath, value]);
        }
      }
    };

    collectEntries(this.data.value);
    return result;
  }

  static fromEntries(entries) {
    const signals = new Signals();

    for (const [path, value] of entries) {
      signals.set(path, value);
    }

    return signals;
  }

  // Comprehensive diagnostics method
  static runDiagnostics() {
    console.log("Running Signals Diagnostics...");
    const signals = new Signals();

    // Test basic set and get
    signals.set("test", 123);
    console.assert(signals.get("test") === 123, "Basic set/get failed");

    // Test nested set and get
    signals.set("nested.value", 456);
    console.assert(signals.get("nested.value") === 456, "Nested set/get failed");

    // Test deep nesting
    signals.set("deep.nesting.test", "deep");
    console.assert(signals.get("deep.nesting.test") === "deep", "Deep nesting failed");

    // Test has method
    console.assert(signals.has("test"), "Has method failed for existing path");
    console.assert(!signals.has("nonexistent"), "Has method failed for non-existing path");

    // Test delete method
    signals.delete("test");
    console.assert(!signals.has("test"), "Delete method failed");

    // Test merge at root
    signals.merge({ a: 1, b: 2 });
    console.assert(signals.get("a") === 1 && signals.get("b") === 2, "Root merge failed");

    // Test merge at path
    signals.merge("nested", { x: 10, y: 20 });
    console.assert(signals.get("nested.x") === 10 && signals.get("nested.y") === 20, "Path merge failed");

    // Test entries and fromEntries
    const testSignals = new Signals();
    testSignals.set("a", 1);
    testSignals.set("b.c", 2);
    testSignals.set("b.d", 3);

    const entriesArray = testSignals.entries();
    console.assert(entriesArray.length === 3, "Entries length check failed");
    console.assert(JSON.stringify(entriesArray.sort()) ===
      JSON.stringify([["a", 1], ["b.c", 2], ["b.d", 3]].sort()),
      "Entries content check failed");

    const reconstructed = Signals.fromEntries(entriesArray);
    console.assert(reconstructed.get("a") === 1, "FromEntries reconstruction failed");
    console.assert(reconstructed.get("b.c") === 2, "FromEntries nested reconstruction failed");

    // Test signal value getter
    const nestedSignal = signals.lookup("nested").object;
    console.assert(nestedSignal instanceof Signal, "Signal instantiation failed");
    console.assert(typeof nestedSignal.value === "object", "Signal value getter failed");

    console.log("Diagnostics completed successfully!");
    return true;
  }
}
