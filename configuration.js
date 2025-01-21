import Signal from 'signal';


class Configuration {
  rate;
  duration;
  simulation;
  processing;

  constructor(){

    // ability to stop, slow, and speed up the running program
    this.rate = new Signal( 1 ); // 0 to stop program! 1=normal-operation
    this.processing = new Signal( .05 ); // 0=disable agent processing delay, .1= wait 10% of duration, fracion of duration used to simulate processing within an agent;

    // how long a marble travels on a pipe
    this.duration = new Signal( 3_000 ); // 0=normal-operation, run live, and disable flow visualizations.

    this.simulation = new Signal(); // 0 means stop

    const simulationCalculation = new Signal(1);
    simulationCalculation.addDependency(this.rate);
    simulationCalculation.addDependency(this.duration);
    simulationCalculation.subscribe((_,rate,duration)=>{
      if(rate==1&&duration==0){
        this.simulation.value = false;
      }else{
        this.simulation.value = true;
      }
    });

  } // constructor

};

export default new Configuration();
