import EventEmitter from './EventEmitter.js';
import Router from './Router.js';

export default class Server extends EventEmitter {
  router = new Router();

  handleRequest(req, res) {
     this.router.handleRequest(req, res);
   }

}
