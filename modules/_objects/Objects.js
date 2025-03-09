class Signals {
  constructor(initialData = {}) {
    this.data = initialData;
  }

  // Helper function to navigate or create nested objects
  lookup(path) {
    const segments = path.split(".");
    let object = this.data;

    // Navigate through the object based on dot notation
    for (let i = 0; i < segments.length - 1; i++) {
      const segment = segments[i];
      if (!object[segment]) object[segment] = {}; // Create nested object if it doesn't exist
      object = object[segment];
    }
    return { object, property: segments[segments.length - 1] };
  }

  // Set value at a specific path (dot notation) in the object
  set(path, value) {
    const { object, property } = this.lookup(path);
    object[property] = value;
  }

  // Get value from a specific path (dot notation) in the object
  get(path) {
    const { object, property } = this.lookup(path);
    return object[property];
  }

  // Check if a specific path (dot notation) exists in the object
  has(path) {
    const { object, property } = this.lookup(path);
    return object.hasOwnProperty(property);
  }

  // Delete a key at a specific path (dot notation)
  delete(path) {
    const { object, property } = this.lookup(path);
    if (object && object.hasOwnProperty(property)) {
      delete object[property];
    }
  }

  // Merge a given object at a specific path (or root if unspecified)
  merge(path, patch = {}) {
    if (typeof path === 'object') {
      patch = path;
      path = '';
    }
    const { object, property } = this.lookup(path || '');
    object[property] = { ...object[property], ...patch };
  }

}
