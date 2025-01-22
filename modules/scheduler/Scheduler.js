export default class Scheduler {

  stopped = false;
  tick = 50; // ms
  beginAnimationAt; // ms
  duration; // Signal()
  localRate; // Signal()
  callback; // funcion

  constructor({begin, duration, localRate, callback}){
    this.callback = callback;
    this.duration = duration;
    this.localRate = localRate;
    this.beginAnimationAt = begin.getTime();
  }

  get progress(){
    const d = parseFloat(this.duration.value/this.localRate.value);
    const completeAnimationAt = (new Date( this.beginAnimationAt + d )).getTime(); // NOTE: live update as signals change
    const currentTime = (new Date()).getTime();
    const fullAnimationDuration = completeAnimationAt - this.beginAnimationAt;
    const currentAnimationDuration = currentTime - this.beginAnimationAt;
    const ratio = currentAnimationDuration/fullAnimationDuration;
    // console.log({ d, completeAnimationAt, currentTime, fullAnimationDuration, currentAnimationDuration, ratio, })
    return ratio;
  }

  start(){
    setTimeout(this.step.bind(this), this.tick);
    // requestAnimationFrame(this.step.bind(this));
    return ()=>this.stop();
  }

  step(){
    if(this.stopped) return;

    if(this.progress < 1){
      // requestAnimationFrame(this.step.bind(this));
      setTimeout(this.step.bind(this), this.tick);
    }else{
      this.callback();
      this.stop();
    }
  }

  stop(){
    this.stopped = true;
  }
}
