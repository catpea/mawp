import Garbage from './Garbage.js';

export default class EventEmitter extends Garbage {
  _events = new Map();
  _maxListeners = 10;

  addListener(eventName, listener) {
    return this._addListener(eventName, listener, false);
  }

  on(eventName, listener) {
    this.addListener(eventName, listener);
    return ()=>this.off(eventName, listener);
  }

  prependListener(eventName, listener) {
    return this._addListener(eventName, listener, true);
  }

  once(eventName, listener) {
    return this._addOnceListener(eventName, listener, false);
  }

  prependOnceListener(eventName, listener) {
    return this._addOnceListener(eventName, listener, true);
  }

  removeListener(eventName, listener) {
    const listeners = this._events.get(eventName);
    if (!listeners) return this;

    for (let i = 0; i < listeners.length; i++) {
      const currentListener = listeners[i];
      if (
        currentListener === listener ||
        (currentListener.listener && currentListener.listener === listener)
      ) {
        listeners.splice(i, 1);
        break;
      }
    }

    if (listeners.length === 0) {
      this._events.delete(eventName);
    }

    return this;
  }

  off(eventName, listener) {
    return this.removeListener(eventName, listener);
  }

  removeAllListeners(eventName) {
    if (eventName) {
      this._events.delete(eventName);
    } else {
      this._events.clear();
    }
    return this;
  }

  listeners(eventName) {
    const listeners = this._events.get(eventName);
    if (!listeners) return [];
    return listeners.map((listener) =>
      listener.listener ? listener.listener : listener
    );
  }

  rawListeners(eventName) {
    const listeners = this._events.get(eventName);
    if (!listeners) return [];
    return listeners.slice();
  }

  listenerCount(eventName) {
    const listeners = this._events.get(eventName);
    return listeners ? listeners.length : 0;
  }

  eventNames() {
    return Array.from(this._events.keys());
  }

  send(...a) {this.emit(...a)}
  emit(eventName, ...args) {
    const listeners = this._events.get(eventName);
    if (!listeners || listeners.length === 0) {
      return false;
    }

    const listenersCopy = listeners.slice();
    for (const listener of listenersCopy) {
      listener.apply(this, args);
    }

    return true;
  }

  setMaxListeners(n) {
    if (typeof n !== 'number' || n < 0 || isNaN(n)) {
      throw new RangeError('"n" argument must be a positive number');
    }
    this._maxListeners = n;
    return this;
  }

  getMaxListeners() {
    return this._maxListeners;
  }

  _addListener(eventName, listener, prepend) {
    if (typeof listener !== 'function') {
      throw new TypeError('"listener" argument must be a function');
    }

    let listeners = this._events.get(eventName);
    if (!listeners) {
      listeners = [];
      this._events.set(eventName, listeners);
    }

    if (prepend) {
      listeners.unshift(listener);
    } else {
      listeners.push(listener);
    }

    // Check for listener leak
    if (
      this._maxListeners &&
      listeners.length > this._maxListeners &&
      !listeners.warned
    ) {
      console.warn(
        `(node:EventEmitter) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. ${listeners.length} ${eventName} listeners added. Use emitter.setMaxListeners() to increase limit`
      );
      listeners.warned = true;
    }

    return this;
  }

  _addOnceListener(eventName, listener, prepend) {
    const wrapper = (...args) => {
      this.off(eventName, wrapper);
      listener.apply(this, args);
    };
    wrapper.listener = listener;
    this._addListener(eventName, wrapper, prepend);
    return this;
  }
}
