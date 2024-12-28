import Services from './src/Services.js';
const services = new Services();
await services.load();
await services.start();

import UI from './src/UI.js';
const ui = new UI(services);
await ui.start();

console.log(`Startup at ${new Date().toISOString()}`);
window.addEventListener('beforeunload', function(event) {
  ui.stop();
  services.stop();
});
