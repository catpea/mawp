class Signal {
  constructor(initialValue) {
    this._value = initialValue;
    this._subscribers = new Set();
  }

  get value() {
    return this._value;
  }

  set value(newValue) {
    if (this._value !== newValue) {
      this._value = newValue;
      this._notifySubscribers();
    }
  }

  subscribe(callback) {
    this._subscribers.add(callback);
    // Return an unsubscribe function
    return () => {
      this._subscribers.delete(callback);
    };
  }

  _notifySubscribers() {
    this._subscribers.forEach((callback) => {
      callback(this._value);
    });
  }
}
