import transcend from 'transcend';

import Dataset from 'dataset';
import Signal from 'signal';
import Series from 'series';

import Focusable from './Focusable.js';

export default class Pipe extends HTMLElement {

  #line;
  #x1 = new Signal(0);
  #y1 = new Signal(0);
  #x2 = new Signal(0);
  #y2 = new Signal(0);

  #lineStrokeSelected = 'var(--bs-primary)';
  #lineStrokes = ['var(--bs-success)', 'rgba(var(--bs-success-rgb), .3)'];
  #lineWidths = [4,2];
  #focusableLineStrokeWidth = 14;

  constructor() {
    super();
    this.dataset2 = new Dataset();
    this.status = new Signal('loading');
    // this.status.subscribe(v => console.log('PIPE STATUS: ', v) );
    this.status.subscribe(v => {
      if (v == 'unloaded') {
        //console.log('Removing Pipe Component', this);
        this.remove();
      }
    });
  }


  connectedCallback() {

    const scene = this.closest(`x-scene`);

    this.observer = new MutationObserver(this.#handleAttributeMutations.bind(this));
    this.observer.observe(this, { attributes: true });
    this.gc = ()=> this.observer.disconnect();

    // SEED DATASET2
    for (const {name, value} of this.attributes) {
      if (name.startsWith('data-')) {
        const key = name.substr(5);
        const val = this.getAttribute(name)
        //console.log('ZZZ', key, val);

        this.dataset2.set(key, val);
      }
    }

    // PROCESS DEPENDENCIES
    const fromDecoder = new Series(this.dataset2.get('from'), attribute => scene.getElementById(attribute.split(':', 1)[0]).status);
    const toDecoder = new Series(this.dataset2.get('to'), attribute => scene.getElementById(attribute.split(':', 1)[0]).status);

    // MONITOR FROM/TO ELEMENTS AND
    const dependencies = new Signal();
    dependencies.addDependency(fromDecoder);
    dependencies.addDependency(toDecoder);
    this.gc = dependencies.subscribe((_, a, b) => {
      //console.log('STATUS', a,b)
      if (a === 'ready' && a === b) {
        this.status.value = 'ready'

      }else if(a === 'unloaded' && a === b){
        this.status.value = 'unloaded'
      }

    });

    // CREATE AND SUBSCRIBE LINES



    let visualIndicatorLine;



    for (const [sceneIndex, svgSurface] of Object.entries(scene.drawingSurfaces)) {
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
    scene.drawingSurfaces[0].appendChild(focusableLine);
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

      scene.getWindow(this.dataset2.get('from').value)
      scene.getWindow(this.dataset2.get('to').value)

      const dependencies = new Signal();

      dependencies.addDependency(fromDecoder);
      dependencies.addDependency(toDecoder);

      dependencies.addDependency(scene.getWindow(this.dataset2.get('from').value).sizeSignal);
      dependencies.addDependency(scene.getWindow(this.dataset2.get('to').value).sizeSignal);

      dependencies.addDependency(scene.getWindow(this.dataset2.get('from').value).dataset2.get('left'));
      dependencies.addDependency(scene.getWindow(this.dataset2.get('from').value).dataset2.get('top'));
      dependencies.addDependency(scene.getWindow(this.dataset2.get('to').value).dataset2.get('left'));
      dependencies.addDependency(scene.getWindow(this.dataset2.get('to').value).dataset2.get('top'));

      this.gc = dependencies.subscribe((_, a, b) => {
        if (a === 'ready' && a === b) {

          // NOTE: this function return untransformed coordinates
          let [x1, y1] = scene.calculateCentralCoordinates(scene.getDecal(this.dataset2.get('from').value));
          let [x2, y2] = scene.calculateCentralCoordinates(scene.getDecal(this.dataset2.get('to').value));

          // Transform Coordinates with Pan and Zoom
          [x1, y1] = scene.transform(x1, y1);
          [x2, y2] = scene.transform(x2, y2);


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

  disconnectedCallback() {
    this.collectGarbage();
  }

  #handleAttributeMutations(mutationsList) {
    for (let mutation of mutationsList) {
      if (mutation.type === 'attributes' && mutation.attributeName.startsWith('data-')) {
        const attributeName = mutation.attributeName;
        const newValue = mutation.target.getAttribute(attributeName);
        //console.log('SET ATTRIBUTE', attributeName.substr(5), newValue);
        this.dataset2.set(attributeName.substr(5), newValue);
      }
    }
  }

  get scene(){
    return transcend(this, `x-scene`);
  }

  // GARBAGE COLLECTION

  #garbage = [];
  collectGarbage(){
    this.#garbage.map(s=>s.subscription())
  }

  set gc(subscription){ // shorthand for component level garbage collection
    this.#garbage.push( {type:'gc', id:'gc-'+this.#garbage.length, ts:(new Date()).toISOString(), subscription} );
  }

}
