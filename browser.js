import Branch from 'branch';

const services = new Branch('services');

import UI from './src/UI.js';
const ui = new UI(services);
await ui.start();

const main = new Branch('main');
main.onStart = async () => console.log('ASYNC START GRRR')
main.once('stop', ()=>console.log('Main scene Branch got stoppppp...'))

const uppercase = new Branch('uppercase');
const tee = new Branch('tee');

services.create(main);
services.create(uppercase);
services.create(tee);

const mainInput = new Branch('mainInput', 'window');
mainInput.dataset.set('title', 'Main Input');
main.create(mainInput)

const uppercaseInput = new Branch('uppercaseInput', 'window');
uppercaseInput.dataset.set('title', 'Transducer');
main.create(uppercaseInput)

const uppercaseOutput = new Branch('uppercaseOutput', 'window');
uppercaseOutput.dataset.set('title', 'Output Branch');
main.create(uppercaseOutput)

const pipe1 = new Branch('pipe1', 'pipe');
pipe1.dataset.set('from', 'mainInput:out');
pipe1.dataset.set('to', 'uppercaseInput:in');
main.create(pipe1);

const pipe2 = new Branch('pipe2', 'pipe');
pipe2.dataset.set('from', 'uppercaseInput:out');
pipe2.dataset.set('to', 'uppercaseOutput:in');
main.create(pipe2);

setInterval(() => {
  mainInput.dataset.set('date', (new Date()).toISOString());
}, 1_000);

await services.load();
await services.start();

console.log(`Startup at ${new Date().toISOString()}`);

window.addEventListener('beforeunload', function(event) {
  ui.stop();
  services.stop();
});
