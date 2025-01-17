import Signal from 'signal';
import Series from 'series';
import Focusable from './Focusable.js';

import ReactiveHTMLElement from '../ReactiveHTMLElement.js';
export default class Pipe extends ReactiveHTMLElement {

  #line;
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



}
