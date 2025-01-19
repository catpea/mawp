import Signal from 'signal';
import Series from 'series';
import guid from 'guid';
import Focusable from './Focusable.js';

import ReactiveHTMLElement from '../ReactiveHTMLElement.js';
export default class Pipe extends ReactiveHTMLElement {

  #line;
  #circle; // TODO: position of the circle should use x1 signals, piggy back
  #rate = new Signal(0); // 0-2 the local rate that affects global delay, lol!
  #x1 = new Signal(0);
  #y1 = new Signal(0);
  #x2 = new Signal(0);
  #y2 = new Signal(0);

  #lineStrokeSelected = 'var(--bs-primary)';
  #lineStrokes = ['var(--bs-success)', 'rgba(var(--bs-success-rgb), .3)'];
  #lineWidths = [4,2];
  #focusableLineStrokeWidth = 14;

  initialize() {
    this.status.subscribe((status) => {
      switch (status) {
        case "loading": // initial state
          // waiting for windows to report ready
          break;
        case "ready": // windows reported ready state
          // be a pipe that updated its x1y1 and x2y2
          break;
        case "unloaded": // one of the windows was unloaded (removed)
          // remove this pipe as it is no longer makeing a from - to connection.
          //NOTE: removal of web component triggers ReactiveHTMLElement.disconnectedCallback and thus garbage collection.
          this.remove();
          break;
        default:
        // code block
      }
    });
  }

  connected() {

    // console.log('pipe debug-delay', this.dataset2.get('debug-delay').value )
    // this.gc = this.agent.on('rx', name=> console.log(`Pipe got data, should play animation for ${this.dataset2.get('debug-delay').value}ms.`) );

    this.gc = this.agent.on('marble:start', name => this.playBall( new Marble({
      container: this.scene.drawingSurfaces[0],
      begin: new Date(),
      duration: this.dataset2.get('debug-delay'),
      rate: this.#rate,
      x1: this.#x1,
      y1: this.#y1,
      x2: this.#x2,
      y2: this.#y2
    }) ) );


    // PROCESS DEPENDENCIES
    const fromWindowStatusSignal = new Series(this.dataset2.get('from'), attribute => this.scene.getElementById(attribute.split(':', 1)[0]).status);
    const toWindowStatusSignal = new Series(this.dataset2.get('to'), attribute => this.scene.getElementById(attribute.split(':', 1)[0]).status);

    // MONITOR FROM/TO ELEMENTS AND
    const dependencies = new Signal();
    dependencies.addDependency(fromWindowStatusSignal);
    dependencies.addDependency(toWindowStatusSignal);
    this.gc = dependencies.subscribe((_, fromWindowStatus, toWindowStatus) => {
      if (fromWindowStatus === 'ready' && toWindowStatus === 'ready') {
        this.status.value = 'ready'
      }else if(fromWindowStatus === 'unloaded' || toWindowStatus === 'unloaded' ){
        this.status.value = 'unloaded'
      }
    });

    // CREATE AND SUBSCRIBE LINES
    let visualIndicatorLine;
    for (const [sceneIndex, svgSurface] of Object.entries(this.scene.drawingSurfaces)) {
      const svgLline = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      if(sceneIndex==0) {
        visualIndicatorLine = svgLline;
      }
      svgLline.setAttribute('stroke',  this.#lineStrokes[sceneIndex]);
      svgLline.setAttribute('stroke-width', this.#lineWidths[sceneIndex]);
      svgSurface.appendChild(svgLline);
      this.gc = this.#x1.subscribe(v=>svgLline.setAttribute('x1', v));
      this.gc = this.#y1.subscribe(v=>svgLline.setAttribute('y1', v));
      this.gc = this.#x2.subscribe(v=>svgLline.setAttribute('x2', v));
      this.gc = this.#y2.subscribe(v=>svgLline.setAttribute('y2', v));
      this.gc = () => svgLline.remove();
    }

    const focusableLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    focusableLine.style.pointerEvents = 'auto';
    focusableLine.setAttribute('stroke',  'rgba(0,0,0,.01)');
    focusableLine.setAttribute('stroke-width', this.#focusableLineStrokeWidth);
    this.scene.drawingSurfaces[0].appendChild(focusableLine);
    this.gc = this.#x1.subscribe(v=>focusableLine.setAttribute('x1', v));
    this.gc = this.#y1.subscribe(v=>focusableLine.setAttribute('y1', v));
    this.gc = this.#x2.subscribe(v=>focusableLine.setAttribute('x2', v));
    this.gc = this.#y2.subscribe(v=>focusableLine.setAttribute('y2', v));
    this.gc = () => focusableLine.remove();
      const focusable = new Focusable(this, focusableLine);
      this.gc = focusable.start();
      this.gc = this.dataset2.get('active').subscribe(v => {
        if(v==='true'){
          visualIndicatorLine.setAttribute('stroke',  this.#lineStrokeSelected);
        }else{
          visualIndicatorLine.setAttribute('stroke',  this.#lineStrokes[0]);
        }
      });

    // WHENEVER FROM OR TO WINDOW CHANGES SIZE, RECALCULATE LINE POSISTION
    this.gc = this.status.subscribe(v => { if (v === 'ready') {
      this.scene.getWindow(this.dataset2.get('from').value)
      this.scene.getWindow(this.dataset2.get('to').value)
      const dependencies = new Signal();
      dependencies.addDependency(fromWindowStatusSignal);
      dependencies.addDependency(toWindowStatusSignal);
      dependencies.addDependency(this.scene.getWindow(this.dataset2.get('from').value).sizeSignal);
      dependencies.addDependency(this.scene.getWindow(this.dataset2.get('to').value).sizeSignal);
      dependencies.addDependency(this.scene.getWindow(this.dataset2.get('from').value).dataset2.get('left'));
      dependencies.addDependency(this.scene.getWindow(this.dataset2.get('from').value).dataset2.get('top'));
      dependencies.addDependency(this.scene.getWindow(this.dataset2.get('to').value).dataset2.get('left'));
      dependencies.addDependency(this.scene.getWindow(this.dataset2.get('to').value).dataset2.get('top'));
      this.gc = dependencies.subscribe((_, a, b) => {
        if (a === 'ready' && a === b) {
          // NOTE: this function return untransformed coordinates
          let [x1, y1] = this.scene.calculateCentralCoordinates(this.scene.getDecal(this.dataset2.get('from').value));
          let [x2, y2] = this.scene.calculateCentralCoordinates(this.scene.getDecal(this.dataset2.get('to').value));
          // Transform Coordinates with Pan and Zoom
          [x1, y1] = this.scene.transform(x1, y1);
          [x2, y2] = this.scene.transform(x2, y2);
          this.#x1.value = x1;
          this.#y1.value = y1;
          this.#x2.value = x2;
          this.#y2.value = y2;
        } else {
          // component exited
        }
      });
    }});
  }


  playBall(marble){
    marble.start();
  }


}


class Marble {

  percentComplete = new Signal(0);

  container; // SVGElement
  marble; // SVGElement
  marbleColor = `hsla(${Math.random() * 360}, 20%, 50%, 1)`;
  marbleRadius = 8;

  beginAnimationAt; // ms
  completeAnimationAt; // ms
  x1; // Signal()
  y1; // Signal()
  x2; // Signal()
  y2; // Signal()

  constructor({container, begin, duration, rate, x1,y1,x2,y2}){

    this.container = container;
    this.beginAnimationAt = begin.getTime();

    const fin = new Date( begin.getTime() + parseFloat(duration.value) );
    this.completeAnimationAt = fin.getTime();

    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;

    this.marble = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    this.marble.setAttribute('r', this.marbleRadius);
    this.marble.setAttribute('fill', this.marbleColor);

  }

  get progress(){
    const currentTime = (new Date()).getTime();
    const fullAnimationDuration = this.completeAnimationAt - this.beginAnimationAt;
    const currentAnimationDuration = currentTime - this.beginAnimationAt;
    const ratio = currentAnimationDuration/fullAnimationDuration;
    return ratio;
  }

  get coordinates(){
    let lenX = this.x2.value - this.x1.value;
    let lenY = this.y2.value - this.y1.value;
    lenX = lenX * this.progress;
    lenY = lenY * this.progress;
    let x =  this.x1.value + lenX;
    let y =  this.y1.value + lenY;
    return [x,y];
  }

  start(){
    this.container.appendChild(this.marble);
    requestAnimationFrame(this.step.bind(this));
  }

  step(){
    const [cx,cy] = this.coordinates;
    this.marble.setAttribute('cx', cx);
    this.marble.setAttribute('cy', cy);
    if(this.progress < 1){
      requestAnimationFrame(this.step.bind(this));
    }else{
      this.stop()
    }
  }

  stop(){
    this.marble.remove();
  }
}
