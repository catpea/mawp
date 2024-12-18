import Actor from './Actor.js';


/*

Failure Strategies:

In a more advanced system, you could implement different strategies for failure, such as:

    Restart: Restart the actor (as we've done in the example).
    Stop: Completely stop the actor and do nothing.
    Escalate: Propagate the failure up to a parent supervisor (if you're working with a hierarchy of supervisors).

Supervision Strategies in Action:

class Supervisor {
    constructor() {
        this.actors = [];
    }

    supervise(actor, strategy = 'restart') {
        actor.strategy = strategy;  // Assign failure strategy to the actor
        this.actors.push(actor);
        console.log(`Supervising actor: ${actor.name} with strategy: ${strategy}`);
    }

    handleFailure(actor, reason) {
        console.log(`${actor.name} failed due to: ${reason.message}`);
        switch (actor.strategy) {
            case 'restart':
                this.restart(actor);
                break;
            case 'stop':
                this.stop(actor);
                break;
            case 'escalate':
                console.log(`Escalating failure of ${actor.name}...`);
                // Further escalation logic could be added here.
                break;
        }
    }

    restart(actor) {
        console.log(`Restarting actor: ${actor.name}`);
        const newActor = new Actor(actor.name);
        actor.state = newActor.state;
        console.log(`${actor.name} has been restarted.`);
    }

    stop(actor) {
        console.log(`Stopping actor: ${actor.name}`);
        actor.stop();
    }

    passMessage(actor, message) {
        try {
            actor.receive(message);
        } catch (error) {
            this.handleFailure(actor, error);
        }
    }

    stopAll() {
        this.actors.forEach(actor => actor.stop());
    }
}

Summary of the Supervisor Design:

    Supervision Strategy: The supervisor uses strategies to handle actor failures, such as restarting, stopping, or escalating.
    Actor Lifecycle Management: Supervisors manage the creation, failure, and termination of actors in the system.
    Resilience: The supervisor provides resilience to the system by handling failures gracefully, allowing actors to recover when things go wrong.

This gives you a foundational approach to implementing a Supervisor pattern in JavaScript, which is a key component of robust, resilient actor-based systems!














// Create the Supervisor
const supervisor = new Supervisor();

// Create some actors
const actor1 = new Actor("Actor 1");
const actor2 = new Actor("Actor 2");

// Supervise the actors
supervisor.supervise(actor1);
supervisor.supervise(actor2);

// Send messages to actors
supervisor.passMessage(actor1, "hello");
supervisor.passMessage(actor2, "fail");  // This will cause actor2 to fail

// Show the state of actors
console.log(`Actor 1 state:`, actor1.getState());
console.log(`Actor 2 state:`, actor2.getState());

// Restarted actor state (Actor 2 should have been restarted)
console.log(`Actor 2 (after restart) state:`, actor2.getState());

// Stop all actors under supervisor
supervisor.stop();



*/
export default class Supervisor extends Actor {

  #actors = [];

  constructor(state){
    super(state);
    this.gc = this.on('input', v => this.processor(v, this.state));
    this.gc = this.on('upgrade', v =>  this.processor = v );
    this.gc = this.on('scene:start', v => this.start(v));
  }








  supervise(actor) {
         this.actors.push(actor);
         console.log(`Supervising actor: ${actor.name}`);
     }

     // Handle failure based on strategy
     handleFailure(actor, reason) {
         console.log(`${actor.name} failed due to: ${reason.message}`);
         // Implementing a simple "restart" strategy:
         this.restart(actor);
     }

     // Restart an actor (for simplicity, we just create a new actor)
     restart(actor) {
         console.log(`Restarting actor: ${actor.name}`);
         const newActor = new Actor(actor.name);
         actor.state = newActor.state;  // Keep the state if necessary
         console.log(`${actor.name} has been restarted.`);
     }

     // Simulate message passing with failure handling
     passMessage(actor, message) {
         try {
             actor.receive(message);
         } catch (error) {
             this.handleFailure(actor, error);
         }
     }






  start(v) {
    console.log(`Actor Worker starting with: `, v);
  }

  stop() {
     this.actors.forEach(actor => actor.stop());
    this.destroy();
  }



}
