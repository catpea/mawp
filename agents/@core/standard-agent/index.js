import Agent from 'agent';

export default class StandardAgent extends Agent {
  process(port, message, sender, setup){
    this.send('out', message, {});
  }
}
