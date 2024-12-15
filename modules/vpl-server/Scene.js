import Actor from './Actor.js';

export default class Scene extends Actor {
  actors = [];

  createActor(id, actorConstructor, initialState) {
    const actor = new actorConstructor(initialState);
    actor.id = id;
    actor.scene = this;
    this.actors.push(actor);
    return actor;
  }

  removeActor(actor) {
      this.actors = this.actors.filter(a => a !== actor);
  }

  broadcast(message) {
    this.actors.forEach(actor => actor.send('scene', message));
  }

  getActor(id) {
      return this.actors.find(o=>o.id===id);
  }

  getActors() {
      return this.actors;
  }

  start(v) {
    this.actors.forEach(actor => actor.send('scene:start', v));
    console.log("Scene started with", this.actors.length, "actors.");
  }

  stop() {
    this.actors.forEach(actor => actor.stop());
    this.destroy();
    console.log("Scene stopped.");
  }

}
