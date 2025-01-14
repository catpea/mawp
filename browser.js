import Signal from 'signal';
import Branch from 'branch';
import Commander from 'commander';

class Project extends Branch {
  Scene = Scene;
  Component = Component;
  Connector = Connector;
  commander;
  activeScene = new Signal('main');

  constructor(...a) {
    super(...a)
    this.commander = new Commander(this);
  }

}

class Scene extends Branch {
  getWindow(id) {
    return this.get(id);
  }

  getRelated(id) { // return items related to id in a scene, usualy for removal.
    const from = this.children.filter(child=>child.type==='pipe').filter(child=>child.dataset.get('from')!==undefined).filter(child=>child.dataset.get('from').value.startsWith(id+':'));
    const to = this.children.filter(child=>child.type==='pipe').filter(child=>child.dataset.get('to')!==undefined).filter(child=>child.dataset.get('to').value.startsWith(id+':'));
    return [...from, ...to];
  }

}

class Component extends Branch {
  constructor(...a) {
    super(...a)
    this.dataset.set('port-in', true);
    this.dataset.set('port-out', true);
  }
}
class Connector extends Branch {

}

const project = new Project('project');

import UI from './src/UI.js';
const ui = new UI(project);



const mainScene = new Scene('main');
// mainScene.onStart = async () => console.log('ASYNC START GRRR')

mainScene.once('stop', () => {
  // console.log('Main scene Branch got stoppppp...')
});

const upperScene = new Scene('upper');
const teeScene = new Scene('tee');

project.create(mainScene);
project.create(upperScene);
project.create(teeScene);




{
  const windowPostMessage = new Component('windowPostMessage', 'window');
  windowPostMessage.dataset.set('title', 'Window API: postMessage');
  windowPostMessage.dataset.set('left', 100);
  windowPostMessage.dataset.set('top', 100);
  windowPostMessage.dataset.set('port-in', false);
  mainScene.create(windowPostMessage)

  const httpRequest = new Component('httpRequest', 'window');
  httpRequest.dataset.set('title', 'HTTP Server API: Request');
  httpRequest.dataset.set('left', 100);
  httpRequest.dataset.set('top', 250);
  httpRequest.dataset.set('port-in', false);
  mainScene.create(httpRequest)

  const scraperResource = new Component('scraperResource', 'window');
  scraperResource.dataset.set('title', 'Scraper API: URL Downloaded');
  scraperResource.dataset.set('left', 100);
  scraperResource.dataset.set('top', 400);
  scraperResource.dataset.set('port-in', false);
  mainScene.create(scraperResource)

  const intervalTimer = new Component('intervalTimer', 'window');
  intervalTimer.dataset.set('title', 'Interval Timer API: Tick');
  intervalTimer.dataset.set('left', 100);
  intervalTimer.dataset.set('top', 550);
  intervalTimer.dataset.set('port-in', false);
  mainScene.create(intervalTimer)

  const uppercaseInput = new Component('uppercaseInput', 'window');
  uppercaseInput.dataset.set('title', 'Transducer');
  uppercaseInput.dataset.set('reference', 'upper');
  uppercaseInput.dataset.set('left', 400);
  uppercaseInput.dataset.set('top', 300);
  uppercaseInput.dataset.set('note', 'Edit me! click the yellow icon ^');
  mainScene.create(uppercaseInput)

  const uppercaseOutput = new Component('uppercaseOutput', 'window');
  uppercaseOutput.dataset.set('title', 'Output Branch');
  uppercaseOutput.dataset.set('left', 700);
  uppercaseOutput.dataset.set('top', 300);
  uppercaseOutput.dataset.set('port-out', false);
  mainScene.create(uppercaseOutput)

  const pipe1 = new Connector('pipe1', 'pipe');
  pipe1.dataset.set('from', 'windowPostMessage:out');
  pipe1.dataset.set('to', 'uppercaseInput:in');
  mainScene.create(pipe1);

  const pipe2 = new Connector('pipe2', 'pipe');
  pipe2.dataset.set('from', 'uppercaseInput:out');
  pipe2.dataset.set('to', 'uppercaseOutput:in');
  mainScene.create(pipe2);
}



{
  const secondaryStream = new Component('secondaryStream', 'window');
  secondaryStream.dataset.set('title', 'Secondary Stream');
  secondaryStream.dataset.set('incoming', true);
  secondaryStream.dataset.set('left', 150);
  secondaryStream.dataset.set('top', 100);
  upperScene.create(secondaryStream)

  const auxiliaryStream = new Component('auxiliaryStream', 'window');
  auxiliaryStream.dataset.set('title', 'Auxiliary Stream');
  auxiliaryStream.dataset.set('incoming', true);
  auxiliaryStream.dataset.set('left', 150);
  auxiliaryStream.dataset.set('top', 500);
  auxiliaryStream.dataset.set('style', 'solid-warning');
  setTimeout(()=>{ auxiliaryStream.dataset.set('style', 'solid-danger'); }, 3_000)
  upperScene.create(auxiliaryStream)

  const uppercaseInput1 = new Component('uppercaseInput', 'window');
  uppercaseInput1.dataset.set('title', 'Transducer2');
  uppercaseInput1.dataset.set('reference', 'tee');
  uppercaseInput1.dataset.set('left', 400);
  uppercaseInput1.dataset.set('top', 300);
  uppercaseInput1.dataset.set('note', 'Edit me too!!!');

  upperScene.create(uppercaseInput1)



  const uppercaseOutput = new Component('uppercaseOutput', 'window');
  uppercaseOutput.dataset.set('title', 'Output');
  uppercaseOutput.dataset.set('left', 700);
  uppercaseOutput.dataset.set('top', 300);
  upperScene.create(uppercaseOutput)

  const pipe0 = new Connector('pipe0', 'pipe');
  pipe0.dataset.set('from', 'secondaryStream:out');
  pipe0.dataset.set('to', 'uppercaseInput:in');
  upperScene.create(pipe0);

  const pipe1 = new Connector('pipe1', 'pipe');
  pipe1.dataset.set('from', 'auxiliaryStream:out');
  pipe1.dataset.set('to', 'uppercaseInput:in');
  upperScene.create(pipe1);

  const pipe2 = new Connector('pipe2', 'pipe');
  pipe2.dataset.set('from', 'uppercaseInput:out');
  pipe2.dataset.set('to', 'uppercaseOutput:in');
  upperScene.create(pipe2);
}





{
  const secondaryStream = new Component('secondaryStream', 'window');
  secondaryStream.dataset.set('title', 'Secondary Stream');
  secondaryStream.dataset.set('incoming', true);
  secondaryStream.dataset.set('left', 150);
  secondaryStream.dataset.set('top', 300);
  teeScene.create(secondaryStream)

  const uppercaseOutput = new Component('uppercaseOutput', 'window');
  uppercaseOutput.dataset.set('title', 'Output');
  uppercaseOutput.dataset.set('left', 700);
  uppercaseOutput.dataset.set('top', 300);
  teeScene.create(uppercaseOutput)

  const pipe0 = new Connector('pipe0', 'pipe');
  pipe0.dataset.set('from', 'secondaryStream:out');
  pipe0.dataset.set('to', 'uppercaseOutput:in');
  teeScene.create(pipe0);

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
