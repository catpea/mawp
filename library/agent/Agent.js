import Dataset from 'dataset';
import guid from 'guid';

export default class Agent {

  constructor() {
    this.id = guid();
    this.dataset = new Dataset();
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
