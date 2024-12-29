import Node from './src/Services.js';

const services = new Node('services');

import UI from './src/UI.js';
const ui = new UI(services);
await ui.start();

const main = new Node('main');
main.onStart = async () => console.log('ASYNC START GRRR')
main.once('stop', ()=>console.log('Main scene node got stoppppp...'))

const uppercase = new Node('uppercase');
const tee = new Node('tee');

services.create(main);
services.create(uppercase);
services.create(tee);

const mainInput = new Node('mainInput', 'Main Input');
main.create(mainInput)

const uppercaseInput = new Node('uppercaseInput', 'Transducer');
main.create(uppercaseInput)

const uppercaseOutput = new Node('uppercaseOutput', 'Output Node');
main.create(uppercaseOutput)

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
