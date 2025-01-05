import Signal from 'signal';
import Branch from 'branch';
import Commander from 'commander';

class Project extends Branch {
  commander;

  active = new Signal('main');

  constructor(...a) {
    super(...a)
    this.commander = new Commander(this);
  }
  get activeScene() {
    return this.get( this.active.value);
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
await ui.start();

const mainScene = new Scene('main');
mainScene.onStart = async () => console.log('ASYNC START GRRR')
mainScene.once('stop', ()=>console.log('Main scene Branch got stoppppp...'))

const uppercaseScene = new Scene('uppercase');
const teeScene = new Scene('tee');

project.create(mainScene);
project.create(uppercaseScene);
project.create(teeScene);










const mainInput = new Branch('mainInput', 'window');
mainInput.dataset.set('title', 'Main Input');
mainScene.create(mainInput)

const uppercaseInput = new Branch('uppercaseInput', 'window');
uppercaseInput.dataset.set('title', 'Transducer');
uppercaseInput.dataset.set('left', 300);
uppercaseInput.dataset.set('top', 300);
mainScene.create(uppercaseInput)

let isIdle = true;
let lastMoveTime = Date.now() -10000;
let idleTimeout = 5000; // Time in milliseconds to consider as idle (5 seconds in this case)

function checkMouseIdle() {
    const currentTime = Date.now();
    if (currentTime - lastMoveTime >= idleTimeout) {
        console.log("Mouse is idle");
      isIdle = true;
    } else {
        console.log("Mouse is active");
      isIdle = false;
    }
}

// Listen for mousemove event to track activity
document.addEventListener("mousemove", () => {
    lastMoveTime = Date.now();
});

// Periodically check if the mouse is idle (you can adjust the interval as needed)
setInterval(checkMouseIdle, 100); // Check every 1 second


function getMinuteHandCoordinates(angleDegrees) {


  // Convert the angle to radians
  const angleRadians = angleDegrees * (Math.PI / 180);

  // Calculate the x and y coordinates
  const x = Math.cos(angleRadians);
  const y = Math.sin(angleRadians);

  return [ x, y ];
}

const uppercaseOutput = new Branch('uppercaseOutput', 'window');
uppercaseOutput.dataset.set('title', 'Output Branch');
uppercaseOutput.dataset.set('left', 600);
uppercaseOutput.dataset.set('top', 600);

let angleDegrees = 0;
setInterval(() => {
  if (!isIdle) {

  return;
  }
  mainInput.dataset.set('left', 100 + (55 * getMinuteHandCoordinates(angleDegrees)[1]));
  uppercaseInput.dataset.set('left', 333 + (11 * getMinuteHandCoordinates(angleDegrees)[1]));
  uppercaseOutput.dataset.set('left', 666 + (22 * getMinuteHandCoordinates(angleDegrees)[0]));
  mainInput.dataset.set('width', 320 + (55 * getMinuteHandCoordinates(angleDegrees)[0]));
  uppercaseInput.dataset.set('width', 420 + (22 * getMinuteHandCoordinates(angleDegrees)[1]));
  uppercaseOutput.dataset.set('width', 300 + (11 * getMinuteHandCoordinates(angleDegrees)[0]));
  angleDegrees += 1;
  if (angleDegrees > 360) angleDegrees = 0;
}, 1_000/60)

mainScene.create(uppercaseOutput)

const pipe1 = new Branch('pipe1', 'pipe');
pipe1.dataset.set('from', 'mainInput:out');
pipe1.dataset.set('to', 'uppercaseInput:in');
mainScene.create(pipe1);

const pipe2 = new Branch('pipe2', 'pipe');
pipe2.dataset.set('from', 'uppercaseInput:out');
pipe2.dataset.set('to', 'uppercaseOutput:in');
mainScene.create(pipe2);

setInterval(() => {
  mainInput.dataset.set('date', (new Date()).toISOString());
}, 1_000);

await project.load();
await project.start();

console.log(`Startup at ${new Date().toISOString()}`);

window.addEventListener('beforeunload', function(event) {
  ui.stop();
  project.stop();
});
