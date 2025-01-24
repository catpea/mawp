import CONFIGURATION from 'configuration';

export default class Scheduler {

  next;
  user = {
    state: null,
    start: null,
    step: null,
    stop: null,
  };
  paused; // Signal
  duration; // Signal
  rate; // Signal
  beginAt;
  ended = false;

  pauseStarted;
  pauseExtensionsMs = 0;

  constructor({state={}, start, step, stop, next=(f) => setTimeout(f, 1_000/20), begin = new Date(), paused, duration, rate=false}){

    this.next = next; // user can send in next: (f) => requestAnimationFrame(f);

    this.user.state = state;
    this.user.start = start;
    this.user.step  = step;
    this.user.stop  = stop;

    this.paused = paused;
    this.duration = duration;
    this.rate = rate;

    this.beginAt = begin.getTime();

    this.paused.subscribe(paused=>{
      if(paused===true){
        this.pauseStarted = new Date();
      }else{
        if(!this.pauseStarted) return;

        const pauseEnded = new Date();
        this.pauseExtensionsMs = this.pauseExtensionsMs + ((pauseEnded.getTime() - this.pauseStarted.getTime())  );
        this.pauseStarted = null;
        // // console.log('pause completed adding', this.pauseExtensionsMs)
        // this.next( this.step.bind(this) );
      }
    })
  }



  get extension(){
    if(!this.pauseStarted) return this.pauseExtensionsMs;

    const pauseEnded = new Date();
    // return this.pauseExtensionsMs + (pauseEnded.getTime() - this.pauseStarted.getTime());
    const a = Math.floor(( pauseEnded.getTime() - this.pauseStarted.getTime()) / 1_000)*1000;
    const b = parseInt( pauseEnded.getTime() -  this.pauseStarted.getTime() );
    //console.log/({a,b});

    return   pauseEnded.getTime() -  this.pauseStarted.getTime() ;
  }

  get progress(){
    const totalDuration = this.rate?this.duration.value/this.rate.value:this.duration.value;
    const extendedDuration = totalDuration + this.extension;
     //consol/e.log('this.extension', this.extension);
    // console.log({totalDuration, extendedDuration});

    // const totalDuration = parseFloat( this.duration.value / this.rate.value );
    const completeAt =  this.beginAt + extendedDuration  // NOTE: live update as signals change


    // if(this.pauseStarted) this.pauseExtensionsMs = this.pauseExtensionsMs + (currentTime - this.pauseStarted.getTime());

    const currentTime = (new Date()).getTime()  ;

    const fullDuration =    completeAt -  this.beginAt;
    const currentDuration = currentTime - this.beginAt;
    const ratio = currentDuration/fullDuration;
    //console.log(/{ratio, currentDuration, fullDuration, currentTime})
    return ratio;
  }
  start(){
    if(this.user.start) this.user.start(this.user.state);
    this.next( this.step.bind(this) );
    return ()=>this.stop();
  }
  step(){
    // if(this.paused.value){
    //   if(this.progress < 1 && this.user.step) this.user.step(this.user.state, this.progress);
    //   return;
    // }
    if(this.ended) return;
    if(this.progress < 1){
      if(this.user.step) this.user.step(this.user.state, this.progress);
      this.next( this.step.bind(this) );
    }else{
      this.stop();
    }
  }
  stop(){
    this.ended = true;
    if(this.user.stop) this.user.stop(this.user.state);
  }
}



// step1(){
//     const currentStepAt = Date.now();
//     const stepGapDuration = currentStepAt - this.laststepAt;
//     this.elapsedDuration += stepGapDuration;
//     if( this.paused.value === true) this.elapsedPausedDuration += stepGapDuration;
//     const targetDuration = this.rate?this.duration.value/this.rate.value:this.duration.value;

//     const progress = this.elapsedDuration / (targetDuration + this.elapsedPausedDuration);


//     if(progress < 1){
//       if(this.user.step) this.user.step(this.user.state, progress);
//       this.next( this.step.bind(this) );
//     }else{
//       this.stop();
//     }

//     this.laststepAt = currentStepAt;
//   }
