#!/usr/bin/env node
import Server from './src/Server.js';
const server = new Server();

// server.on('/hello', v=>console.log('HELLO!',v))
// server.emit('/hello')


// Define a route with a capture group for :id
server.router.get('/events/:id', (req, res) => {
  const { id } = req.params;  // Path parameters
  const { page, sort } = req.query;  // Query parameters

  res.statusCode = 200;
  res.end(`Handling event with ID: ${id}, Page: ${page || 1}, Sort: ${sort || 'asc'}`);
});


const req1 = { method: 'GET', url: '/events/123?page=2&sort=asc' };
const res1 = {
  statusCode: 200,
  end: function (message) {
    console.log(message);  // Expected output: Handling event with ID: 123, Page: 2, Sort: asc
  },
};

// server.handleRequest(req1, res1);



const req2 = { method: 'GET', url: '/events/456' };
const res2 = {
  statusCode: 200,
  end: function (message) {
    console.log(message);  // Expected output: Handling event with ID: 456, Page: 1, Sort: asc
  },
};

// server.handleRequest(req2, res2);













// server.context.db = {};
// server.on('error', err => {
//   log.error('server error', err);
// });

// ctx; // is the Context
// ctx.request; // is a Koa Request
// ctx.response; // is a Koa Response

// server.use(async ctx => {
//   ctx.body = 'Hello World';
// });

// server.get('/', (req, res) => {
//   res.send('Hello World!')
// })

// // server.listen(3000);
// //

// const response = await server.fetch('/hello');
// const json = await response.json();
// console.log(json);









import Worker from './src/Worker.js';
import Pipe from './src/Pipe.js';

class QuickPipe extends Pipe {
  start(v,state) {
    this.connect(this.state.from, this.state.to);
  }
}
class EchoWorker extends Worker {
  processor(input, state) {
    console.log(input, state);
  }
}

class RouteListener extends Worker {
  processor({ url }, { method='GET'}) {
    const req1 = { method, url };
    const res1 = { statusCode: 200, end: (v) => { console.log('v', v); this.send('output', v) }, };
    console.log(req1, res1);
    server.handleRequest(req1, res1);
  }
}




import Scene from './src/Scene.js';

const scene = new Scene();
const routeListener = scene.createActor(RouteListener, {});
scene.createActor(EchoWorker, {});
scene.createActor(QuickPipe, {from:'a:output',to:'b:input'});

scene.start('Hello from start.js!');

routeListener.send('input', {url:'/events/123?page=42&sort=asc'})
