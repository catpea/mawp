import Signal from 'signal';
import Dataset from 'dataset';
import guid from 'guid';

export default class Agent {

  id = guid();
  dataset = new Dataset();
  health = new Signal('nominal'); // nominal, primary, secondary, success, danger, warning, info, light, dark.

  constructor() {

  }

  initialize(){}
  upgrade(state, extra){}
  status(){}
  terminate(){}

  connection(port, pipe){
  }
  disconnection(port, pipe){
  }

  send(message, all=false){}
  receive(message){}
}
