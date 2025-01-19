import Signal from 'signal';
import Branch from 'branch';
import Commander from 'commander';

import Agent from 'agent';

const DEBUGGER = {delay:5_000};

class Project extends Branch {
  Scene = Location;
  Component = Component;
  Connector = Connector;
  BasicAgent = BasicAgent;
  ConnectorAgent = ConnectorAgent;

  commander;
  activeLocation = new Signal('main');

  constructor(...a) {
    super(...a)
    this.commander = new Commander(this);
  }

  // LIFECYCLE SYSTEM

  async load(url){
    ///console.log('TODO...');
  }
  async save(url){
    ///console.log('TODO...');
  }

  async startup(){
    // await Promise.all( this.all.filter(o=>o.onStart).map(o=>o.onStart()) )
    // this.all.map(node=>node.emit('start'));
    this.all.map(node=>node.start?node.start():null);
  }

  async shutdown(){
    // await Promise.all(this.all.filter(o=>o.onStop).map(o=>o.onStop()))
    // this.all.map(node => node.emit('stop'));
    this.all.map(node=>node.stop?node.stop():null);
  }


}

class Location extends Branch {

  getRelated(id) { // return items related to id in a scene, usualy for removal.
    const from = this.children.filter(child=>child.type==='pipe').filter(child=>child.dataset.get('from')!==undefined).filter(child=>child.dataset.get('from').value.startsWith(id+':'));
    const to = this.children.filter(child=>child.type==='pipe').filter(child=>child.dataset.get('to')!==undefined).filter(child=>child.dataset.get('to').value.startsWith(id+':'));
    return [...from, ...to];
  }

  createComponent(id, options, agent){
    // Initialize important objects
    const component = new Component(id);
    component.agent = agent;

    // Assign options
    Object.entries(options).filter(([key,val])=>val).forEach(([key,val])=>component.dataset.set(key,val))

    if(DEBUGGER){
      // send DEBUGGER (Which is the VPL UI) values to their subsystems (plain object for agent for efficency)
      component.debug = DEBUGGER; // values for branch
      if( component.agent) component.agent.debug = DEBUGGER; // values for agent
      Object.entries(DEBUGGER).forEach(([key,val])=>component.dataset.set('debug-'+key,val)) // values for UI
    }

    // Add to stage
    this.create(component);
    return component;
  }

  createConnection(fromAddress, toAddress){
    // Initialize important objects
    const connector = new Connector();
    connector.agent = new ConnectorAgent();

    // Assign options
    connector.dataset.set('from', fromAddress);
    connector.dataset.set('to', toAddress);
    connector.dataset.subscribe((k, v) => connector.agent.settings.set(k, v));

    if(DEBUGGER){
      // send DEBUGGER (Which is the VPL UI) values to their subsystems (plain object for agent for efficency)
      if(connector.agent && DEBUGGER) connector.agent.debug = DEBUGGER;
      connector.debug = DEBUGGER; // values for branch
      Object.entries(DEBUGGER).forEach(([key,val])=>connector.dataset.set('debug-'+key,val)) // values for UI
    }


    // Add to stage
    this.create(connector);
    return connector;
  }



}






class BasicAgent extends Agent {
  process(port, message, sender, setup){
    this.send('out', message, {});
  }
}

class DataMerge extends Agent {
  process(port, message, sender, setup){
    this.send('out', message, {});
  }
}

class ReactiveVariable extends Agent {
  #previousValue = undefined;
  process(port, message, sender, setup){
    //console.warn('ReactiveVariable RECEIVE', this.id, ...[...arguments])
    const newValue = message;

    if( newValue === undefined || newValue === null ) return; // NOTE: core feature: not interested in empty
    if(this.deepEqual(newValue, this.#previousValue)) return; // NOTE: core feature: silent on unchanged

    this.send('out', newValue, {});

    this.#previousValue = newValue;
  }

  // --- PERSONAL HELPER FUNCIONS --- //

  deepEqual(a, b, visited = new Set()) {
    // Check for strict equality first
    if (a === b) {
      return true;
    }

    // If either value is primitive, they are not equal (since !==)
    if (this.isPrimitive(a) || this.isPrimitive(b)) {
      return false;
    }

    // Handle cyclic references
    if (visited.has(a)) {
      return true; // Assume cyclic structures are equal
    }
    visited.add(a);

    // Ensure both are of the same type
    if (Object.prototype.toString.call(a) !== Object.prototype.toString.call(b)) {
      return false;
    }

    // Compare arrays
    if (Array.isArray(a)) {
      if (a.length !== b.length) {
        return false;
      }

      for (let i = 0; i < a.length; i++) {
        if (!this.deepEqual(a[i], b[i], visited)) {
          return false;
        }
      }

      return true;
    }

    // Compare objects
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    // Check for different number of keys
    if (keysA.length !== keysB.length) {
      return false;
    }

    // Check if all keys and values are equal
    for (let key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) {
        return false;
      }
      if (!this.deepEqual(a[key], b[key], visited)) {
        return false;
      }
    }

    return true;
  }
  isPrimitive(value) {
    return value === null || (typeof value !== 'object' && typeof value !== 'function');
  }
}

class DataBeacon extends Agent {

  initialize(options) {

    this.settings.types('interval:Number delay:Number');
    this.settings.group('user', 'interval delay');

    this.settings.interval = 2_000;
    this.settings.delay = 1_000;

    Object.entries(options).forEach(([key,val])=>this.settings.set(key,val))

  }

  start(){
    this.pulseCounter = 0;
    this.intervalId = setInterval( this.generateData.bind(this), this.settings.interval);
    this.generateData();
  }

  stop(){
    clearInterval(this.intervalId);
  }

  process(port, message, sender, setup){
    if(message.value){
      // this.health.value = 'none';
    }else{
      // this.health.value = 'info'
    }

    const data = message ;
    this.send('out', data, {});
  }

  // --- PERSONAL HELPER FUNCIONS --- //

  generateData(){
      this.pulseCounter++;
      const pulse = {counter: this.pulseCounter, value: this.pulseCounter % 2 == 0};
      this.process('in', pulse, null, {}); // NOTE: you must use process directly as receive receives UI hooks, a made up port needs to use process directly.
    }
}


// class OldConnectorAgent extends Agent {

//   start(){
//     const address = this.settings.get('from').value;
//     const [fromId, fromPort] = address.split(':');
//     const [toId, toPort] = this.settings.get('to').value.split(':');
//     if(!this.source.agent) return console.warn(this.settings.get('from').value + ' has no agent')

//     if(!this.debug){
//       this.gc = this.source.agent.on(`send:${fromPort}`, (data, options)=>this.destination.agent.receive(toPort, data, address, options));
//     }else{
//       this.gc = this.source.agent.on(`send:${fromPort}`, (data, options)=>{
//         setTimeout(()=> this.destination.agent.receive(toPort, data, address, options), this.debug.delay); // simulate delay
//       });

//     }

//   }
//   stop(){
//     this.collectGarbage()
//   }


// }
//

class ConnectorAgent extends Agent {
  // used to send important signals up to AI




}







// class Connector_AGENT extends Branch {
//   constructor(id) {
//     super(id, 'pipe');
//     this.agent = new ConnectorAgent();
//     // we just happen to share the same settings here
//     this.dataset.subscribe((k, v) => this.agent.settings.set(k, v));
//   }

//   start(){
//     if(this.agent && DEBUGGER) this.agent.debug = DEBUGGER;

//     const [fromId] = this.dataset.get('from').value.split(':');
//     const [toId] = this.dataset.get('to').value.split(':');

//     this.agent.source = this.parent.get(fromId);
//     this.agent.destination = this.parent.get(toId);

//     this.agent.start();
//   }

//   stop(){
//     this.agent.stop();
//     this.collectGarbage()
//   }

// }




class Component extends Branch {

  debug = null; // {delay:1_234}

  constructor(id) {
    super(id, 'window')
    this.dataset.set('port-in', true);
    this.dataset.set('port-out', true);
  }
  start(){
    if(this.agent) this.agent.start();
  }

  stop(){
    if(this.agent) this.agent.stop();
    this.collectGarbage()
  }
}

class Connector extends Branch {
  debug = null; // {delay:1_234}

  constructor(id) {
    super(id, 'pipe');
  }

  start(){

    const address = this.dataset.get('from').value.split(':');
    const [fromId, port] = address;
    const [toId, toPort] = this.dataset.get('to').value.split(':');

    const source = this.parent.get(fromId);
    const destination = this.parent.get(toId);

    if(!source.agent) return console.warn(source.id + ' has no agent')

      this.gc = source.agent.on(`send:${port}`, (data, options)=>{
        if(DEBUGGER) this.agent.emit('marble:start', port) // as data is received, trigger the ball rolling
        destination.agent.receive(toPort, data, address, options);
        if(DEBUGGER) this.agent.receive(toPort, data, address, options); // IN A CONNECTOR local agent gets a copy of data
      });
    //
    // if(!this.debug){
    //   this.gc = source.agent.on(`send:${fromPort}`, (data, options)=>destination.agent.receive(toPort, data, address, options));
    //   if(DEBUGGER) this.agent.receive(toPort, data, address, options); // IN A CONNECTOR local agent gets a copy of data
    // }else{
    //   this.gc = source.agent.on(`send:${fromPort}`, (data, options)=>{
    //     // simulate delay, and allow animations to run
    //     setTimeout(()=>{
    //       destination.agent.receive(toPort, data, address, options);
    //       if(DEBUGGER) this.agent.receive(toPort, data, address, options); // IN A CONNECTOR local agent gets a copy of data
    //     }, this.debug.delay);
    //   });
    //
    //}

  }

  stop(){
    this.collectGarbage()
  }
}

const project = new Project('project');
import UI from './src/UI.js';
const ui = new UI(project);

const mainLocation = new Location('main');
const upperLocation = new Location('upper');
const teeLocation = new Location('tee');

project.create(mainLocation);
project.create(upperLocation);
project.create(teeLocation);

{

  mainLocation.createComponent('beacon1', {title: 'Beacon Transmitter Agent', left: 100, top: 100, 'port-in': false, }, new DataBeacon({interval: 4333}) );
  mainLocation.createComponent('beacon2', {title: 'Beacon Transmitter Agent', left: 100, top: 400, 'port-in': false, }, new DataBeacon({interval: 3000}) );


  mainLocation.createComponent('merge1', {title: 'Data Merge', left: 500, top: 333 }, new DataMerge());
  mainLocation.createConnection('beacon1:out', 'merge1:in');
  mainLocation.createConnection('beacon2:out', 'merge1:in');

  mainLocation.createComponent('dataSignal1', {title: 'Data Signal', left: 800, top: 333 }, new ReactiveVariable());
  mainLocation.createConnection('merge1:out', 'dataSignal1:in');

  mainLocation.createComponent('dataSignal2', {title: 'Beacon Transmitter Agent', left: 100, top: 777, 'port-in': false, });
  mainLocation.createComponent('dataLog1', {title: 'Debug Display', left: 800, top: 777, 'port-out': false, });
  mainLocation.createConnection('dataSignal2:out', 'dataLog1:in');

  // const beacon1 = new Component('beacon1');
  // beacon1.agent = new DataSignal({interval: 6000});
  // beacon1.dataset.set('title', 'Beacon Transmitter Agent');
  // beacon1.dataset.set('left', 100);
  // beacon1.dataset.set('top', 100);
  // beacon1.dataset.set('port-in', false);
  // mainLocation.create(beacon1)


  // const beacon2 = new Component('beacon2');
  // beacon2.agent = new DataSignal({interval: 6000});
  // beacon2.dataset.set('title', 'Beacon Transmitter Agent');
  // beacon2.dataset.set('left', 100);
  // beacon2.dataset.set('top', 400);
  // beacon2.dataset.set('port-in', false);
  // mainLocation.create(beacon2)


  // const combinator1 = new Component('combinator1');
  // combinator1.agent = new DataMerge();
  // combinator1.dataset.set('title', 'Combinator');
  // combinator1.dataset.set('left', 500);
  // combinator1.dataset.set('top', 333);
  // mainLocation.create(combinator1)



  // const dataSignal1 = new Component('dataSignal1');
  // dataSignal1.agent = new ReactiveVariable();
  // dataSignal1.dataset.set('title', 'Data Signal');
  // dataSignal1.dataset.set('left', 800);
  // dataSignal1.dataset.set('top', 333);
  // mainLocation.create(dataSignal1)

  // Below

  // const dataSignal2 = new Component('dataSignal2');
  // // dataSignal2.agent = new BeaconTransmitter({interval: 6000});
  // dataSignal2.dataset.set('title', 'Beacon Transmitter Agent');
  // dataSignal2.dataset.set('left', 100);
  // dataSignal2.dataset.set('top', 777);
  // dataSignal2.dataset.set('port-in', false);
  // mainLocation.create(dataSignal2)


  // const dataLog1 = new Component('dataLog1');
  // // dataLog1.agent = new BeaconTransmitter({interval: 6000});
  // dataLog1.dataset.set('title', 'Beacon Transmitter Agent');
  // dataLog1.dataset.set('left', 800);
  // dataLog1.dataset.set('top', 777);
  // dataLog1.dataset.set('port-out', false);
  // mainLocation.create(dataLog1)




}
// {
//   const windowPostMessage = new Component('windowPostMessage');
//   windowPostMessage.dataset.set('title', 'Window API: postMessage');
//   windowPostMessage.dataset.set('left', 100);
//   windowPostMessage.dataset.set('top', 100);
//   windowPostMessage.dataset.set('port-in', false);
//   mainLocation.create(windowPostMessage)

//   const httpRequest = new Component('httpRequest');
//   httpRequest.dataset.set('title', 'HTTP Server API: Request');
//   httpRequest.dataset.set('left', 100);
//   httpRequest.dataset.set('top', 250);
//   httpRequest.dataset.set('port-in', false);
//   mainLocation.create(httpRequest)

//   const scraperResource = new Component('scraperResource');
//   scraperResource.dataset.set('title', 'Scraper API: URL Downloaded');
//   scraperResource.dataset.set('left', 100);
//   scraperResource.dataset.set('top', 400);
//   scraperResource.dataset.set('port-in', false);
//   mainLocation.create(scraperResource)

//   const intervalTimer = new Component('beaconTransmitter');
//   intervalTimer.agent = new BeaconTransmitter({interval: 6000});
//   intervalTimer.dataset.set('title', 'Beacon Transmitter Agent');
//   intervalTimer.dataset.set('left', 100);
//   intervalTimer.dataset.set('top', 550);
//   intervalTimer.dataset.set('port-in', false);
//   mainLocation.create(intervalTimer)

//   const uppercaseInput = new Component('uppercaseInput');
//   uppercaseInput.dataset.set('title', 'Transducer');
//   uppercaseInput.dataset.set('reference', 'upper');
//   uppercaseInput.dataset.set('left', 400);
//   uppercaseInput.dataset.set('top', 300);
//   uppercaseInput.dataset.set('note', 'Edit me! click the arrow icon in the caption bar.');
//   mainLocation.create(uppercaseInput)

//   const uppercaseOutput = new Component('uppercaseOutput');
//   uppercaseOutput.dataset.set('title', 'Output Branch');
//   uppercaseOutput.dataset.set('left', 700);
//   uppercaseOutput.dataset.set('top', 300);
//   uppercaseOutput.dataset.set('port-out', false);
//   mainLocation.create(uppercaseOutput)

//   const pipe1 = new Connector('pipe1');
//   pipe1.dataset.set('from', 'windowPostMessage:out');
//   pipe1.dataset.set('to', 'uppercaseInput:in');
//   mainLocation.create(pipe1);

//   const pipe2 = new Connector('pipe2');
//   pipe2.dataset.set('from', 'uppercaseInput:out');
//   pipe2.dataset.set('to', 'uppercaseOutput:in');
//   mainLocation.create(pipe2);
// }



{
  const secondaryStream = new Component('secondaryStream');
  secondaryStream.dataset.set('title', 'Secondary Stream');
  secondaryStream.dataset.set('incoming', true);
  secondaryStream.dataset.set('left', 150);
  secondaryStream.dataset.set('top', 100);
  upperLocation.create(secondaryStream)

  const auxiliaryStream = new Component('auxiliaryStream');
  auxiliaryStream.dataset.set('title', 'Auxiliary Stream');
  auxiliaryStream.dataset.set('incoming', true);
  auxiliaryStream.dataset.set('left', 150);
  auxiliaryStream.dataset.set('top', 500);
  auxiliaryStream.dataset.set('style', 'solid-warning');
  setTimeout(()=>{ auxiliaryStream.dataset.set('style', 'solid-danger'); }, 3_000)
  upperLocation.create(auxiliaryStream)

  const uppercaseInput1 = new Component('uppercaseInput');
  uppercaseInput1.dataset.set('title', 'Transducer2');
  uppercaseInput1.dataset.set('reference', 'tee');
  uppercaseInput1.dataset.set('left', 400);
  uppercaseInput1.dataset.set('top', 300);
  uppercaseInput1.dataset.set('note', 'Edit me too!!!');

  upperLocation.create(uppercaseInput1)



  const uppercaseOutput = new Component('uppercaseOutput');
  uppercaseOutput.dataset.set('title', 'Output');
  uppercaseOutput.dataset.set('left', 700);
  uppercaseOutput.dataset.set('top', 300);
  upperLocation.create(uppercaseOutput)

  const pipe0 = new Connector('pipe0');
  pipe0.dataset.set('from', 'secondaryStream:out');
  pipe0.dataset.set('to', 'uppercaseInput:in');
  upperLocation.create(pipe0);

  const pipe1 = new Connector('pipe1');
  pipe1.dataset.set('from', 'auxiliaryStream:out');
  pipe1.dataset.set('to', 'uppercaseInput:in');
  upperLocation.create(pipe1);

  const pipe2 = new Connector('pipe2');
  pipe2.dataset.set('from', 'uppercaseInput:out');
  pipe2.dataset.set('to', 'uppercaseOutput:in');
  upperLocation.create(pipe2);
}





{
  const secondaryStream = new Component('secondaryStream');
  secondaryStream.dataset.set('title', 'Secondary Stream');
  secondaryStream.dataset.set('incoming', true);
  secondaryStream.dataset.set('left', 150);
  secondaryStream.dataset.set('top', 300);
  teeLocation.create(secondaryStream)

  const uppercaseOutput = new Component('uppercaseOutput');
  uppercaseOutput.dataset.set('title', 'Output');
  uppercaseOutput.dataset.set('left', 700);
  uppercaseOutput.dataset.set('top', 300);
  teeLocation.create(uppercaseOutput)

  const pipe0 = new Connector('pipe0');
  pipe0.dataset.set('from', 'secondaryStream:out');
  pipe0.dataset.set('to', 'uppercaseOutput:in');
  teeLocation.create(pipe0);

}








// let isIdle = true;
// let lastMoveTime = Date.now() -10000;
// let idleTimeout = 5000; // Time in milliseconds to consider as idle (5 seconds in this case)

// function checkMouseIdle() {
//     const currentTime = Date.now();
//     if (currentTime - lastMoveTime >= idleTimeout) {
//         console.log("Mouse is idle");
//       isIdle = true;
//     } else {
//         console.log("Mouse is active");
//       isIdle = false;
//     }
// }

// // Listen for mousemove event to track activity
// document.addEventListener("mousemove", () => {
//     lastMoveTime = Date.now();
// });

// // Periodically check if the mouse is idle (you can adjust the interval as needed)
// setInterval(checkMouseIdle, 100); // Check every 1 second




// function getMinuteHandCoordinates(angleDegrees) {


//   // Convert the angle to radians
//   const angleRadians = angleDegrees * (Math.PI / 180);

//   // Calculate the x and y coordinates
//   const x = Math.cos(angleRadians);
//   const y = Math.sin(angleRadians);

//   return [ x, y ];
// }



// let angleDegrees = 0;
// setInterval(() => {
//   if (!isIdle) {

//   return;
//   }
//   mainInput.dataset.set('left', 100 + (55 * getMinuteHandCoordinates(angleDegrees)[1]));
//   uppercaseInput.dataset.set('left', 333 + (11 * getMinuteHandCoordinates(angleDegrees)[1]));
//   uppercaseOutput.dataset.set('left', 666 + (22 * getMinuteHandCoordinates(angleDegrees)[0]));
//   mainInput.dataset.set('width', 320 + (55 * getMinuteHandCoordinates(angleDegrees)[0]));
//   uppercaseInput.dataset.set('width', 420 + (22 * getMinuteHandCoordinates(angleDegrees)[1]));
//   uppercaseOutput.dataset.set('width', 300 + (11 * getMinuteHandCoordinates(angleDegrees)[0]));
//   angleDegrees += 1;
//   if (angleDegrees > 360) angleDegrees = 0;
// }, 1_000/60)

















// setInterval(() => {
//   mainInput.dataset.set('date', (new Date()).toISOString());
// }, 1_000);

await project.load();
await project.startup();
await ui.start(); // WARN: must come after the tree has fully loaded, otherwise the watcher will begin adding nodes, that are yet to be loaded.

//console.log(`Startup at ${new Date().toISOString()}`);

// window.addEventListener('beforeunload', function(event) {
//   //console.log('beforeunload was triggered!')
//   // ui.stop();
//   // project.shutdown();
// });
