import CONFIGURATION from 'configuration';

import Signal from 'signal';
import Series from 'series';
import Scheduler from 'scheduler';
import guid from 'guid';
import Focusable from './Focusable.js';

import ReactiveHTMLElement from '../ReactiveHTMLElement.js';
export default class Pipe extends ReactiveHTMLElement {

  #line;
  #circle; // TODO: position of the circle should use x1 signals, piggy back

  #x1 = new Signal(0);
  #y1 = new Signal(0);
  #x2 = new Signal(0);
  #y2 = new Signal(0);

  #currentColor = new Signal();
  #colorSelection = {
    dry: 'var(--bs-secondary)',
    wet: 'var(--bs-success)',
    active: 'var(--bs-primary)',
    // unused: selected: 'var(--bs-primary)'
  };

  #lineWidths = [4, 2];
  #focusableLineStrokeWidth = 14;

  initialize() {
    this.status.subscribe((status) => {
      switch (status) {
        case "loading": // initial state
          // waiting for windows to report ready

          break;
        case "ready": // windows reported ready state
          // be a pipe that updated its x1y1 and x2y2
          //console.log('Pipe in ready mode!');

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
    this.gc = this.source.on('activate-marble', () => this.activateMarble() );

    this.#currentColor.value = this.#colorSelection.dry;

    // PROCESS DEPENDENCIES
    //console.log('XXX', this.source.settings.get('from', 'value') );
    const fromWindowStatusSignal = new Series(this.source.settings.signal('from', 'value'), attribute => this.scene.getElementById(attribute.split(':', 1)[0]).status);
    const toWindowStatusSignal = new Series(this.source.settings.signal('to', 'value'), attribute => this.scene.getElementById(attribute.split(':', 1)[0]).status);

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

    const visualIndicatorLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    visualIndicatorLine.setAttribute('stroke',  this.#currentColor.value);
    visualIndicatorLine.setAttribute('stroke-width', 4);
    this.scene.drawingSurfaces[0].appendChild(visualIndicatorLine);
    this.gc = this.#x1.subscribe(v=>visualIndicatorLine.setAttribute('x1', v));
    this.gc = this.#y1.subscribe(v=>visualIndicatorLine.setAttribute('y1', v));
    this.gc = this.#x2.subscribe(v=>visualIndicatorLine.setAttribute('x2', v));
    this.gc = this.#y2.subscribe(v=>visualIndicatorLine.setAttribute('y2', v));
    this.gc = () => visualIndicatorLine.remove();

    const magicalOverlayLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    magicalOverlayLine.setAttribute('stroke',  this.#currentColor.value);
    magicalOverlayLine.setAttribute('stroke-opacity', .2);
    magicalOverlayLine.setAttribute('stroke-width', 2);
    this.scene.drawingSurfaces[1].appendChild(magicalOverlayLine);
    this.gc = this.#x1.subscribe(v=>magicalOverlayLine.setAttribute('x1', v));
    this.gc = this.#y1.subscribe(v=>magicalOverlayLine.setAttribute('y1', v));
    this.gc = this.#x2.subscribe(v=>magicalOverlayLine.setAttribute('x2', v));
    this.gc = this.#y2.subscribe(v=>magicalOverlayLine.setAttribute('y2', v));
    this.gc = () => magicalOverlayLine.remove();




    this.#currentColor.subscribe(v=>visualIndicatorLine.setAttribute('stroke',v));
    this.#currentColor.subscribe(v=>magicalOverlayLine.setAttribute('stroke',v));

    this.gc = this.source.dry.subscribe(v => {
      if(v){
        //visualIndicatorLine.setAttribute('stroke',  'var(--bs-secondary)');
        this.#currentColor.value = this.#colorSelection.dry;
      }else{
        //visualIndicatorLine.setAttribute('stroke',  'var(--bs-success)');
        this.#currentColor.value = this.#colorSelection.wet;
      }
    });


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
      this.gc = this.source.settings.subscribe('active', 'value', v => {
        if(v===true){
          // WHEN ACTIVE
          this.#currentColor.value = this.#colorSelection.active;
        }else{
          // WHEN NOT ACTIVE || RESTORE COLOR
          this.#currentColor.value = this.source.dry.value?this.#colorSelection.dry:this.#colorSelection.wet;
        }
      });



    // WHENEVER FROM OR TO WINDOW CHANGES SIZE, RECALCULATE LINE POSISTION
    this.gc = this.status.subscribe(v => { if (v === 'ready') {
      this.scene.getWindow(this.source.settings.get('from'))
      this.scene.getWindow(this.source.settings.get('to'))
      const dependencies = new Signal();
      dependencies.addDependency(fromWindowStatusSignal);
      dependencies.addDependency(toWindowStatusSignal);
      dependencies.addDependency(this.scene.getWindow(this.source.settings.get('from', 'value')).sizeSignal);
      dependencies.addDependency(this.scene.getWindow(this.source.settings.get('to', 'value')).sizeSignal);
      dependencies.addDependency(this.scene.getWindow(this.source.settings.get('from', 'value')).source.settings.signal('left', 'value'));
      dependencies.addDependency(this.scene.getWindow(this.source.settings.get('from', 'value')).source.settings.signal('top', 'value'));
      dependencies.addDependency(this.scene.getWindow(this.source.settings.get('to', 'value')).source.settings.signal('left', 'value'));
      dependencies.addDependency(this.scene.getWindow(this.source.settings.get('to', 'value')).source.settings.signal('top', 'value'));
      this.gc = dependencies.subscribe((_, a, b) => {
        if (a === 'ready' && a === b) {
          // NOTE: this function return untransformed coordinates
          let [x1, y1] = this.scene.calculateCentralCoordinates(this.scene.getDecal(this.source.settings.get('from', 'value')));
          let [x2, y2] = this.scene.calculateCentralCoordinates(this.scene.getDecal(this.source.settings.get('to', 'value')));
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


  activateMarble(){

    const state = {
      container: this.scene.drawingSurfaces[0],
      x1: this.#x1,
      y1: this.#y1,
      x2: this.#x2,
      y2: this.#y2,
    }

    const start = (state)=>{
      const randomColor = `hsla(${Math.random() * 360}, 20%, 50%, 1)`;
      const marbleRadius = 8;
      state.marble = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      state.marble.setAttribute('r', marbleRadius);
      state.marble.setAttribute('fill', randomColor);
      state.container.appendChild(state.marble);
    };

    const step = (state, progress)=>{
      let startOfX = state.x1.value;
      let startOfY = state.y1.value;
      let totalLengthOfX = (state.x2.value - state.x1.value);
      let totalLengthOfY = (state.y2.value - state.y1.value);
      let curentLengthOfX = totalLengthOfX * progress;
      let curentLengthOfY = totalLengthOfY * progress;
      let cx = startOfX + curentLengthOfX;
      let cy = startOfY + curentLengthOfY;
      state.marble.setAttribute('cx', cx);
      state.marble.setAttribute('cy', cy);
    };

    const cleanup = (state)=>{
      state.marble.remove();
    }

    const options = {
      state,
      start,
      step,
      cleanup,
      next: ƒ => requestAnimationFrame(ƒ),
      rate: this.source.rate,
      duration: CONFIGURATION.flowDuration,
      paused: CONFIGURATION.paused,
    };

    const scheduler = new Scheduler(options);
    this.gc = scheduler.start();

  }


}
