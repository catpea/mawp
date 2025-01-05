import Signal from 'signal';
import Branch from 'branch';
import Commander from 'commander';

console.log('------------------------------SYSTEM START!------------------------------')

class Project extends Branch {
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
}

const project = new Project('project');

import UI from './src/UI.js';
const ui = new UI(project);



const mainScene = new Scene('main');
mainScene.onStart = async () => console.log('ASYNC START GRRR')

mainScene.once('stop', () => {
  console.log('Main scene Branch got stoppppp...')
});

const upperScene = new Scene('upper');
const teeScene = new Scene('tee');

project.create(mainScene);
project.create(upperScene);
project.create(teeScene);




{
  const windowPostMessage = new Branch('windowPostMessage', 'window');
  windowPostMessage.dataset.set('title', 'Window API: postMessage');
  windowPostMessage.dataset.set('left', 100);
  windowPostMessage.dataset.set('top', 300);
  mainScene.create(windowPostMessage)

  const uppercaseInput = new Branch('uppercaseInput', 'window');
  uppercaseInput.dataset.set('title', 'Transducer');
  uppercaseInput.dataset.set('reference', 'upper');
  uppercaseInput.dataset.set('left', 400);
  uppercaseInput.dataset.set('top', 300);
  uppercaseInput.dataset.set('note', 'Edit me! click the yellow icon ^');
  mainScene.create(uppercaseInput)

  const uppercaseOutput = new Branch('uppercaseOutput', 'window');
  uppercaseOutput.dataset.set('title', 'Output Branch');
  uppercaseOutput.dataset.set('left', 700);
  uppercaseOutput.dataset.set('top', 300);
  mainScene.create(uppercaseOutput)

  const pipe1 = new Branch('pipe1', 'pipe');
  pipe1.dataset.set('from', 'windowPostMessage:out');
  pipe1.dataset.set('to', 'uppercaseInput:in');
  mainScene.create(pipe1);

  const pipe2 = new Branch('pipe2', 'pipe');
  pipe2.dataset.set('from', 'uppercaseInput:out');
  pipe2.dataset.set('to', 'uppercaseOutput:in');
  mainScene.create(pipe2);
}



{
  const secondaryStream = new Branch('secondaryStream', 'window');
  secondaryStream.dataset.set('title', 'Secondary Stream');
  secondaryStream.dataset.set('incoming', true);
  secondaryStream.dataset.set('left', 150);
  secondaryStream.dataset.set('top', 100);
  upperScene.create(secondaryStream)

  const auxiliaryStream = new Branch('auxiliaryStream', 'window');
  auxiliaryStream.dataset.set('title', 'Auxiliary Stream');
  auxiliaryStream.dataset.set('incoming', true);
  auxiliaryStream.dataset.set('left', 150);
  auxiliaryStream.dataset.set('top', 500);
  upperScene.create(auxiliaryStream)

  const uppercaseInput1 = new Branch('uppercaseInput', 'window');
  uppercaseInput1.dataset.set('title', 'Transducer2');
  uppercaseInput1.dataset.set('reference', 'tee');
  uppercaseInput1.dataset.set('left', 400);
  uppercaseInput1.dataset.set('top', 300);
  uppercaseInput1.dataset.set('note', 'Edit me too!!!');

  upperScene.create(uppercaseInput1)



  const uppercaseOutput = new Branch('uppercaseOutput', 'window');
  uppercaseOutput.dataset.set('title', 'Output');
  uppercaseOutput.dataset.set('left', 700);
  uppercaseOutput.dataset.set('top', 300);
  upperScene.create(uppercaseOutput)

  const pipe0 = new Branch('pipe0', 'pipe');
  pipe0.dataset.set('from', 'secondaryStream:out');
  pipe0.dataset.set('to', 'uppercaseInput:in');
  upperScene.create(pipe0);

  const pipe1 = new Branch('pipe1', 'pipe');
  pipe1.dataset.set('from', 'auxiliaryStream:out');
  pipe1.dataset.set('to', 'uppercaseInput:in');
  upperScene.create(pipe1);

  const pipe2 = new Branch('pipe2', 'pipe');
  pipe2.dataset.set('from', 'uppercaseInput:out');
  pipe2.dataset.set('to', 'uppercaseOutput:in');
  upperScene.create(pipe2);
}





{
  const secondaryStream = new Branch('secondaryStream', 'window');
  secondaryStream.dataset.set('title', 'Secondary Stream');
  secondaryStream.dataset.set('incoming', true);
  secondaryStream.dataset.set('left', 150);
  secondaryStream.dataset.set('top', 300);
  teeScene.create(secondaryStream)

  const uppercaseOutput = new Branch('uppercaseOutput', 'window');
  uppercaseOutput.dataset.set('title', 'Output');
  uppercaseOutput.dataset.set('left', 700);
  uppercaseOutput.dataset.set('top', 300);
  teeScene.create(uppercaseOutput)

  const pipe0 = new Branch('pipe0', 'pipe');
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

console.log(`Startup at ${new Date().toISOString()}`);

window.addEventListener('beforeunload', function(event) {
  console.log('beforeunload was triggered!')
  // ui.stop();
  // project.stop();
});
