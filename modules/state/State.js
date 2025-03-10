class State {
  #activeState;
  listeners;
  constructor(value) {
    this.#activeState = value;
    this.listeners = [];
  }
  subscribe(listener) {
    this.listeners.push(listener);
    if (this.#activeState !== undefined) listener(this.#activeState);
    return () => this.unsubscribe(listener);
  }
  unsubscribe(listener) {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }
  notify(previousState) {
    this.listeners.forEach((listener) =>
      listener(this.#activeState, previousState),
    );
  }
  set value(requestedState) {
    const previousState = this.#activeState;
    if (previousState == requestedState) return;
    this.#activeState = requestedState;
    this.notify(previousState);
  }
  get value() {
    return this.#activeState;
  }
}

export default class StateMachine {
  constructor(context, actionMap) {
    this.context = context;
    this.actionMap = actionMap;
    this.name = new State("uninitialized"); // superposition

    // Define valid state transitions
    this.transitions = {
      uninitialized: ["initialized"],

      initialized: ["started"],
      started: ["paused", "stopped"],
      paused: ["started", "stopped"],
      stopped: ["started", "disposed"],
      disposed: [], // No valid transitions from disposed state
    };
  }

  // Helper to validate state transitions
  canTransitionTo(newState) {
    const validTransitions = this.transitions[this.name.value];
    return validTransitions.includes(newState);
  }

  // Helper to handle state changes
  changeState(newState) {
    if (!this.canTransitionTo(newState)) {
      throw new Error(
        `Invalid state transition: ${this.name.value} -> ${newState}`,
      );
    }

    const prevState = this.name.value;
    this.name.value = newState;

    // Emit state change event (could be enhanced with proper event emitter)
    //console.log(`State changed: ${prevState} -> ${this.name.value}`);
  }

  // Get current state
  getState() {
    return this.name.value;
  }

  initialize() {
    if (this.name.value === "uninitialized") {
      if('preinit' in this.context) this.context.preinit();
      this.actionMap.initialize();
      if('postinit' in this.context) this.context.postinit();
      this.changeState("initialized");
    }else{
      throw new Error('Will not change state from uninitialized as conditions are unmet')
    }
  }

  // Public state change methods
  start() {
    if (this.name.value === "initialized" || this.name.value === "paused") {
      this.actionMap.start();
      this.changeState("started");
      if('monitoring' in this.context) this.context.monitoring();

    }else{
      throw new Error('Will not change state to started as conditions are unmet')
    }
  }

  pause() {
    if (this.name.value === "started") {
      this.actionMap.pause();
      this.changeState("paused");
    }else{
      throw new Error('Will not change state to paused as conditions are unmet')
    }
  }

  resume() {
    if (this.name.value === "paused") {
      this.actionMap.resume();
      this.changeState("started");
    }else{
      throw new Error('Will not change state to started as conditions are unmet')
    }
  }

  stop() {
    if (this.name.value === "started" || this.name.value === "paused") {
      this.actionMap.stop();
      this.changeState("stopped");
    }else{
      throw new Error('Will not change state to stopped as conditions are unmet')
    }
  }

  dispose() {
    if (this.name.value === "stopped") {
      this.actionMap.dispose();
      this.changeState("disposed");
    }else{
      throw new Error('Will not change state to disposed as conditions are unmet')
    }
  }
}
