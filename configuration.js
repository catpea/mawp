import Signal from 'signal';


class Configuration {
  simulation; // true/false
  rate;
  flowDuration;
  computationDuration;

  constructor(){

    this.paused = new Signal(); // time does not pass
    this.simulation = new Signal( true ); // true=gui-mode, false=server-mode

    // ability to stop, slow, and speed up the running program
    this.rate = new Signal( .5 ); // 0 to stop program! 1=normal-operation

    // These are for simulations of computations and packets flowing over a wire
    this.computationDurationMs = new Signal( 100 ); // ms
    this.flowDurationMs = new Signal( 500 ); // ms

    this.computationDuration = new Signal( this.computationDurationMs.value / this.rate.value );
    this.flowDuration = new Signal( this.flowDurationMs.value / this.rate.value );

    // my signals can have dependencies
    const simulationCalculation = new Signal(1);
    simulationCalculation.addDependency(this.rate);
    simulationCalculation.addDependency(this.computationDurationMs);
    simulationCalculation.addDependency(this.flowDurationMs);
    simulationCalculation.subscribe((_,rate, computationDurationMs, flowDurationMs)=>{

    this.computationDuration.value = computationDurationMs / rate;

    if(rate<=0.05) rate = 0.05;
    this.flowDuration.value = flowDurationMs / (rate * rate);
    if(rate===1) this.flowDuration.value = 0; // LUDICROUS SPEED!

    });

  } // constructor

};

export default new Configuration();
