export default class Scheduler {

  user = {
    state: null, // user's own state
    start: null, // user's start callback
    step: null,  // user's step callback
    stop: null,  // user's stop callback
  };

  next;

  duration; // System's Signal holding duration in miliseconds
  rate; // System's Signal holding rate that can influence duration, this is unused
  paused; // System's Signal holding whether applicaion is paused or not

  laststepAt;
  elapsedDuration = 0;
  elapsedPausedDuration = 0;

  constructor({state={}, start, step, stop, next=(f) => setTimeout(f, 1_000/20), duration, rate=false, paused=false}){
    this.next = next; // user can send in next: (f) => requestAnimationFrame(f);
    // User things
    this.user.state = state;
    this.user.start = start;
    this.user.step  = step;
    this.user.stop  = stop;
    // CONFIGURATION
    this.duration = duration;
    this.rate = rate; // NOTE: this is local rate control, globa rate is already accounted for in duration
    this.paused = paused;
  }

  start(){
    this.laststepAt = Date.now();

    if(this.user.start) this.user.start(this.user.state);
    this.next( this.step.bind(this) ); // begin the scheduling
    return ()=>this.stop(); // for gc
  }

  step(){
    const currentStepAt = Date.now();
    const stepGapDuration = currentStepAt - this.laststepAt;
    this.elapsedDuration += stepGapDuration;
    if(this.paused.value === true) this.elapsedPausedDuration += stepGapDuration;
    const totalElapsedDuration = this.elapsedDuration - this.elapsedPausedDuration;
    const targetDuration = this.rate ? this.duration.value / this.rate.value : this.duration.value;

    const progress = totalElapsedDuration / targetDuration;
    if(progress < 1){
      if(this.user.step) this.user.step(this.user.state, progress);
      this.next( this.step.bind(this) );
    } else {
      this.stop();
    }
    this.laststepAt = currentStepAt;
  }

  stop(){
    this.COMPLETED = true;
    if(this.user.stop) this.user.stop(this.user.state);
  }

}
