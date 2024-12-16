import Signal from 'sys-signal';

// WARN: this may run under node!
export default class Services {

  #selected = new Signal('main');
  #list = new Signal({
    main:[
      { id: 'a', type: 'actor', kind: 'function', dataset: {} },
      {id:'b', type:'actor', kind:'function', dataset:{}},
      {id:'c', type:'pipe',  from:'a:output', to:'b:input', dataset:{}},
    ],
  });

  async load(){
    console.log('Load something...');
  }

  async start(){
    console.log('Load XML with savefiles...');
  }

  async stop(){

  }
}
