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
    this.rate = new Signal( .01 ); // 0 to stop program! 1=normal-operation

    this.computationDurationMs = new Signal( 100 ); // ms
    this.flowDurationMs = new Signal( 500 ); // ms

    this.computationDuration = new Signal( this.computationDurationMs.value / this.rate.value );
    this.flowDuration = new Signal( this.flowDurationMs.value / this.rate.value );


    const simulationCalculation = new Signal(1);
    simulationCalculation.addDependency(this.rate);
    simulationCalculation.addDependency(this.computationDurationMs);
    simulationCalculation.addDependency(this.flowDurationMs);
    simulationCalculation.subscribe((_,rate, computationDurationMs, flowDurationMs)=>{

      if(rate === 0){
        const oneHour = 1_000*60*60;
        const oneHundredYears = oneHour*24*365*100;
        this.computationDuration.value = oneHundredYears;
        this.flowDuration.value = oneHundredYears;
      } else if(rate === 1){
        this.computationDuration.value = 10;
        this.flowDuration.value = 10;
      }else{
        this.computationDuration.value = computationDurationMs / rate;
        this.flowDuration.value = flowDurationMs / rate;
      }


    });

  } // constructor

};

export default new Configuration();
