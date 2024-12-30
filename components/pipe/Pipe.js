import config from 'system-configuration';
import Dataset from 'dataset';
import Signal from 'signal';
import Series from 'series';

export default class Pipe extends HTMLElement {

  #line;
  #x1 = new Signal(0);
  #y1 = new Signal(0);
  #x2 = new Signal(0);
  #y2 = new Signal(0);
  #stroke = 'teal';
  #strokeWidth = '2';
  #strokeWidthClickOverlay = '8';

    constructor() {
      super();
      this.dataset2 = new Dataset();
      this.status = new Signal('loading');

      this.status.subscribe(v => console.log('PIPE STATUS: ', v) );



    }

    connectedCallback() {
      const scene = this.closest(`${config.prefix}-scene`);

      const handleMutations = (mutationsList) => {
         for (let mutation of mutationsList) {
           if (mutation.type === 'attributes' && mutation.attributeName.startsWith('data-')) {
             const attributeName = mutation.attributeName;
             const newValue = mutation.target.getAttribute(attributeName);
             // console.log('SET ATTRIBUTE', attributeName, newValue);
             this.dataset2.set(attributeName.split('-')[1], newValue);
           }
         }
       }
      this.observer = new MutationObserver(handleMutations);
      this.observer.observe(this, { attributes: true });
      this.gc = ()=> observer.disconnect();

      for (const {name, value} of this.attributes) {
        if (name.startsWith('data-')) {
          this.dataset2.set(name.split('-')[1], this.getAttribute(name));
        }
      }

      // PROCESS DEPENDENCIES
      const fromDecoder = new Series(this.dataset2.get('from'), attribute => scene.getElementById(attribute.split(/\W/, 1)[0]).status);
      const toDecoder = new Series(this.dataset2.get('to'), attribute => scene.getElementById(attribute.split(/\W/, 1)[0]).status);

      // MONITOR FROM/TO ELEMENTS AND
      const dependencies = new Signal(1);
      dependencies.addDependency(fromDecoder);
      dependencies.addDependency(toDecoder);
      this.gc = dependencies.subscribe((_, a, b) => { if (a === 'ready' && a === b) this.status.value = 'ready' });

      // CREATE AND SUBSCRIBE LINES
      for (const svgSurface of scene.drawingSurfaces) {
        console.error('LINES CANNOT BE SHARED, there are multiple line surfaces now')
        this.#line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        this.#line.setAttribute('stroke', this.#stroke);
        this.#line.setAttribute('stroke-width', this.#strokeWidth);
        svgSurface.appendChild(this.#line);
        this.gc = this.#x1.subscribe(v=>this.#line.setAttribute('x1', v));
        this.gc = this.#y1.subscribe(v=>this.#line.setAttribute('y1', v));
        this.gc = this.#x2.subscribe(v=>this.#line.setAttribute('x2', v));
        this.gc = this.#y2.subscribe(v=>this.#line.setAttribute('y2', v));
      }

      this.gc = this.status.subscribe(v => {
        if (v === 'ready') {

          const fromElement = scene.getElementById(this.dataset2.get('from').value.split(/\W/, 1)[0]);
          const toElement = scene.getElementById(this.dataset2.get('to').value.split(/\W/, 1)[0]);
          const fromPort = fromElement.getPortElement(this.dataset2.get('from').value.split(/\W/, 2)[1]);
          const toPort = toElement.getPortElement(this.dataset2.get('to').value.split(/\W/, 2)[1]);
          const fromPortSticker = fromPort.getDecal();
          const toPortSticker = toPort.getDecal();

          setInterval(()=>{
            const [x1, y1] = this.calculatePortCoordinates(fromPortSticker);
            const [x2, y2] = this.calculatePortCoordinates(toPortSticker);

            this.#x1.value = x1;
            this.#y1.value = y1;
            this.#x2.value = x2;
            this.#y2.value = y2;
          },1000)



      }});

    }

    calculatePortCoordinates(el) {
      const scene = this.closest(`${config.prefix}-scene`);

      let {x:elementX,y:elementY, width:elementW, height:elementH} = el.getBoundingClientRect();

      const scrollLeft = window.scrollX || window.pageXOffset;
      const scrollTop = window.scrollY || window.pageYOffset;
      elementX = elementX + scrollLeft;
      elementY = elementY + scrollTop;

      const panZoom = scene;
      if(!panZoom) return; // component destroyed
      let {x:panX,y:panY} = panZoom.pan;
      let zoom = panZoom.zoom;

      elementX = elementX / zoom;
      elementY = elementY / zoom;

      elementW = elementW / zoom;
      elementH = elementH / zoom;

      const centerW = elementW/2;
      const centerH = elementH/2;

      panX = panX / zoom;
      panY = panY / zoom;

      const positionedX = elementX-panX;
      const positionedY = elementY-panY;

      const centeredX = positionedX+centerW;
      const centeredY = positionedY+centerH;

      return [centeredX, centeredY ];
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
