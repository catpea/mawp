import Services from './src/Services.js';
import UI from './src/UI.js';

const services = new Services();
const ui = new UI(services);

await services.load();
await services.start();
await ui.start();

console.log(`Startup at ${new Date().toISOString()}`);

window.addEventListener('beforeunload', function(event) {
  ui.stop();
  services.stop();
});
