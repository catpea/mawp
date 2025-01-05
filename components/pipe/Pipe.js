import Dataset from 'dataset';
import Signal from 'signal';
import Series from 'series';

export default class Pipe extends HTMLElement {

  #line;
  #x1 = new Signal(0);
  #y1 = new Signal(0);
  #x2 = new Signal(0);
  #y2 = new Signal(0);
  #stroke = '#20c997'; // bs teal
  #strokeWidth = 4;
  #strokeWidthDelta = .5;
  #strokeWidthClickOverlay = '8';

  constructor() {
    super();
    this.dataset2 = new Dataset();
    this.status = new Signal('loading');
    this.status.subscribe(v => console.log('PIPE STATUS: ', v) );
    this.status.subscribe(v => {
      if (v == 'unloaded') {
        console.log('Removing Pipe Component', this);
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
        this.dataset2.set(name.split('-')[1], this.getAttribute(name));
      }
    }

    // PROCESS DEPENDENCIES
    const fromDecoder = new Series(this.dataset2.get('from'), attribute => scene.getElementById(attribute.split(/\W/, 1)[0]).status);
    const toDecoder = new Series(this.dataset2.get('to'), attribute => scene.getElementById(attribute.split(/\W/, 1)[0]).status);

    // MONITOR FROM/TO ELEMENTS AND
    const dependencies = new Signal();
    dependencies.addDependency(fromDecoder);
    dependencies.addDependency(toDecoder);
    this.gc = dependencies.subscribe((_, a, b) => {
      console.log('STATUS', a,b)
      if (a === 'ready' && a === b) {
        this.status.value = 'ready'

      }else if(a === 'unloaded' && a === b){
        this.status.value = 'unloaded'
      }

    });

    // CREATE AND SUBSCRIBE LINES
    let actualStroke = this.#strokeWidth;
    for (const svgSurface of scene.drawingSurfaces) {
      const svgLline = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      svgLline.setAttribute('stroke', this.#stroke);
      svgLline.setAttribute('stroke-width', actualStroke);
      svgSurface.appendChild(svgLline);
      this.gc = this.#x1.subscribe(v=>svgLline.setAttribute('x1', v));
      this.gc = this.#y1.subscribe(v=>svgLline.setAttribute('y1', v));
      this.gc = this.#x2.subscribe(v=>svgLline.setAttribute('x2', v));
      this.gc = this.#y2.subscribe(v=>svgLline.setAttribute('y2', v));
      this.gc = () => svgLline.remove();
      actualStroke = this.#strokeWidth * this.#strokeWidthDelta;
    }

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
          const [x1, y1] = scene.calculateCentralCoordinates(scene.getDecal(this.dataset2.get('from').value));
          const [x2, y2] = scene.calculateCentralCoordinates(scene.getDecal(this.dataset2.get('to').value));
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
        // console.log('SET ATTRIBUTE', attributeName, newValue);
        this.dataset2.set(attributeName.split('-')[1], newValue);
      }
    }
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
