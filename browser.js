import Services from './src/Services.js';
import UI from './src/UI.js';

const services = new Services();
const ui = new UI(services);

await services.start();
await ui.start();

window.addEventListener('beforeunload', function(event) {
  ui.stop();
  services.stop();
});
