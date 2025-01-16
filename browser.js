import Signal from 'signal';
import Branch from 'branch';
import Commander from 'commander';

import Agent from 'agent';

class Project extends Branch {
  Scene = Location;
  Component = Component;
  Connector = Connector;
  commander;
  activeLocation = new Signal('main');

  constructor(...a) {
    super(...a)
    this.commander = new Commander(this);
  }

}

class Location extends Branch {

  getRelated(id) { // return items related to id in a scene, usualy for removal.
    const from = this.children.filter(child=>child.type==='pipe').filter(child=>child.dataset.get('from')!==undefined).filter(child=>child.dataset.get('from').value.startsWith(id+':'));
    const to = this.children.filter(child=>child.type==='pipe').filter(child=>child.dataset.get('to')!==undefined).filter(child=>child.dataset.get('to').value.startsWith(id+':'));
    return [...from, ...to];
  }

}




class BeaconTransmitter extends Agent {
  constructor() {
    super();
    // this.dataset.set('interval', 600);
    this.dataset.set('interval', 60_000);
  }
  start(){
    this.pulseCounter = 0;
    this.intervalId = setInterval( this.beacon.bind(this), this.dataset.get('interval').value );
    this.beacon();
  }
  stop(){
    clearInterval(this.intervalId);
  }


  receive(message){
    console.info(message);
  }

  // --- BeaconTransmitter HELPER FUNCIONS --- //

  beacon(){
      this.pulseCounter++;
      const pulse = {counter: this.pulseCounter, value: this.pulseCounter % 2 == 0};
      this.receive(pulse);
    }
}




class Component extends Branch {
  constructor(id) {
    super(id, 'window')
    this.dataset.set('port-in', true);
    this.dataset.set('port-out', true);
  }
}

class Connector extends Branch {
  constructor(id) {
    super(id, 'pipe')
  }
}

const project = new Project('project');

import UI from './src/UI.js';
const ui = new UI(project);



const mainLocation = new Location('main');
// mainScene.onStart = async () => console.log('ASYNC START GRRR')

mainLocation.once('stop', () => {
  // console.log('Main scene Branch got stoppppp...')
});

const upperLocation = new Location('upper');
const teeLocation = new Location('tee');

project.create(mainLocation);
project.create(upperLocation);
project.create(teeLocation);




{
  const windowPostMessage = new Component('windowPostMessage');
  windowPostMessage.dataset.set('title', 'Window API: postMessage');
  windowPostMessage.dataset.set('left', 100);
  windowPostMessage.dataset.set('top', 100);
  windowPostMessage.dataset.set('port-in', false);
  mainLocation.create(windowPostMessage)

  const httpRequest = new Component('httpRequest');
  httpRequest.dataset.set('title', 'HTTP Server API: Request');
  httpRequest.dataset.set('left', 100);
  httpRequest.dataset.set('top', 250);
  httpRequest.dataset.set('port-in', false);
  mainLocation.create(httpRequest)

  const scraperResource = new Component('scraperResource');
  scraperResource.dataset.set('title', 'Scraper API: URL Downloaded');
  scraperResource.dataset.set('left', 100);
  scraperResource.dataset.set('top', 400);
  scraperResource.dataset.set('port-in', false);
  mainLocation.create(scraperResource)

  const intervalTimer = new Component('beaconTransmitter');
  intervalTimer.agent = new BeaconTransmitter({interval: 6000});
  intervalTimer.dataset.set('title', 'Beacon Transmitter Agent');
  intervalTimer.dataset.set('left', 100);
  intervalTimer.dataset.set('top', 550);
  intervalTimer.dataset.set('port-in', false);
  mainLocation.create(intervalTimer)

  const uppercaseInput = new Component('uppercaseInput');
  uppercaseInput.dataset.set('title', 'Transducer');
  uppercaseInput.dataset.set('reference', 'upper');
  uppercaseInput.dataset.set('left', 400);
  uppercaseInput.dataset.set('top', 300);
  uppercaseInput.dataset.set('note', 'Edit me! click the arrow icon in the caption bar.');
  mainLocation.create(uppercaseInput)

  const uppercaseOutput = new Component('uppercaseOutput');
  uppercaseOutput.dataset.set('title', 'Output Branch');
  uppercaseOutput.dataset.set('left', 700);
  uppercaseOutput.dataset.set('top', 300);
  uppercaseOutput.dataset.set('port-out', false);
  mainLocation.create(uppercaseOutput)

  const pipe1 = new Connector('pipe1');
  pipe1.dataset.set('from', 'windowPostMessage:out');
  pipe1.dataset.set('to', 'uppercaseInput:in');
  mainLocation.create(pipe1);

  const pipe2 = new Connector('pipe2');
  pipe2.dataset.set('from', 'uppercaseInput:out');
  pipe2.dataset.set('to', 'uppercaseOutput:in');
  mainLocation.create(pipe2);
}



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
await project.start();

await ui.start(); // WARN: must come after the tree has fully loaded, otherwise the watcher will begin adding nodes, that are yet to be loaded.

//console.log(`Startup at ${new Date().toISOString()}`);

window.addEventListener('beforeunload', function(event) {
  console.log('beforeunload was triggered!')
  // ui.stop();
  // project.stop();
});
