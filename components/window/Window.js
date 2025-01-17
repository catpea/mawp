import Signal from 'signal';
import Dataset from 'dataset';

import lol from 'lol';
import transcend from 'transcend';

import Movable from './Movable.js';
import Focusable from './Focusable.js';

import ReactiveHTMLElement from '../ReactiveHTMLElement.js';
export default class Window extends ReactiveHTMLElement {

    // el =
    // this.el.destroyButton
    // #el = {
    //   destroyButton: '[name=remove-component]',
    //   openReferencedSceneButton: '[name=open-referenced-scene]',
    // };
    // el = new Proxy({}, {
    //   get(target, elementName, receiver) {
    //     const matches = this.querySelectorAll( this.#el[elementName] )
    //     return matches;
    // });
    //
      // #elements: {
      // SELECTOR                    | el.GETTER ????
      //   "dblclick"                : "open",
      //   "click .icon.doc"         : "select",
      //   "contextmenu .icon.doc"   : "showMenu",
      //   "click .show_notes"       : "toggleNotes",
      //   "click .title .lock"      : "editAccessLevel",
      //   "mouseover .title .date"  : "showTooltip"
      // },

      // #events: {
      //   "dblclick"                : "open",
      //   "click .icon.doc"         : "select",
      //   "contextmenu .icon.doc"   : "showMenu",
      //   "click .show_notes"       : "toggleNotes",
      //   "click .title .lock"      : "editAccessLevel",
      //   "mouseover .title .date"  : "showTooltip"
      // },


    initialize() {
      this.sizeSignal = new Signal([0,0]);

      this.attachShadow({ mode: 'open' });

      const localStyle = `
        .card.active {
          border-color: var(--bs-primary);
        }
      `;

      this.styles(localStyle);


    }

    connected() {

       // creating a container for the editable-list component
      const cardNode = document.createElement('div');

      if(this.agent){
        this.agent.health.subscribe(health=>this.changeCardStyle(cardNode, `border-${health}`));
      }

      // adding a class to our container for the sake of clarity
      cardNode.classList.add('card', 'text-center', 'm-4', 'shadow', 'position-absolute');

      // creating the inner HTML of the editable list element
      cardNode.innerHTML = `
          <div class="card-header cursor-default user-select-none">
             <span class="card-title"></span>
          </div>
          <ul class="list-group list-group-flush">
          </ul>
          <div class="card-footer text-body-secondary" style="font-size: .75rem">
          </div>
      `;

      // appending the container to the shadow DOM
      this.shadowRoot.appendChild(cardNode);

      const cardHeader = this.shadowRoot.querySelector('.card-header');
      const cardFooter = this.shadowRoot.querySelector('.card-footer');
      const listGroup = this.shadowRoot.querySelector('.list-group');
      const cardTitle = this.shadowRoot.querySelector('.card-header .card-title');

      this.dataset2.get('date').subscribe(v => cardFooter.textContent = v);
      this.dataset2.get('title').subscribe(v => cardTitle.textContent = v);
      this.dataset2.get('note').subscribe(v => cardFooter.textContent = v);
      this.dataset2.get('zindex').subscribe(v => cardNode.style.zIndex = v);
      this.dataset2.get('style').subscribe(newStyle => this.changeCardStyle(cardNode, newStyle));

      const iolistItem = lol.li({class:'list-group-item bg-transparent d-none'});
      listGroup.appendChild(iolistItem);

      this.dataset2.get('port-in').subscribe(portEnabled => {
        if(portEnabled == 'true'){
          const portNode = lol['x-port']({ id: `port-in`, dataset:{title:'In', side: 'start', icon: 'circle'} });
          iolistItem.classList.remove('d-none');
          iolistItem.appendChild(portNode)
        }
      });

      this.dataset2.get('port-out').subscribe(portEnabled => {
        if(portEnabled == 'true'){
          const portNode = lol['x-port']({ id: `port-out`, dataset:{title:'Out', side: 'end', icon: 'circle'} });
          iolistItem.classList.remove('d-none');
          iolistItem.appendChild(portNode)
        }
      });

      this.dataset2.get('reference').subscribe(reference => {

        // Create Button
        if(reference) cardHeader.appendChild(lol.i({ name:'open-referenced-scene' ,class:'bi bi-arrow-right-circle text-muted float-end cursor-pointer ms-2', on:{ click:()=> this.application.project.commander.sceneSelect({id:this.dataset2.get('reference').value}) }}))

        const referencedScene = this.application.project.get(reference);
        for( const element of referencedScene.children.filter(child=>child.dataset.get('incoming').value ) ){
          const portNode = lol['x-port']({ id: `port-${element.id}`, dataset:{title:element.dataset.get('title').value, side: 'start', icon: 'box-arrow-in-right'} });
          const listItem = lol.li({class:'list-group-item bg-transparent'}, portNode);
          listGroup.appendChild(listItem)
        }

      });

      cardHeader.appendChild(lol.i({ name:'remove-component' ,class:'bi bi-x-circle text-muted float-end cursor-pointer ms-2', on:{ click:()=> this.application.project.commander.windowDelete({id:this.id}) && this.scene.clearFocus() }}))
      cardHeader.appendChild(lol.i({ name:'configure-component' ,class:'bi bi-wrench-adjustable-circle text-muted float-end cursor-pointer ms-2', on:{ click:()=> this.application.project.commander.windowRead({id:this.id}) }}))

      // TODO: if a window is center/center put it in the center of the scene.
      this.dataset2.get('left').subscribe(v => cardNode.style.left = v + 'px');
      this.dataset2.get('top').subscribe(v => cardNode.style.top = v + 'px');


      this.dataset2.get('width').subscribe(v => cardNode.style.width = v + 'px');
      this.dataset2.get('height').subscribe(v => cardNode.style.height = v + 'px');

      // const cardIO = shadow.querySelector('.list-group-item:first');

      const focusable = new Focusable(this);
      this.gc = focusable.start();

      this.gc = this.scene.active.subscribe(v => {
        if(v && v == this.id){
          cardNode.classList.add('active');
        }else{
          cardNode.classList.remove('active')
        }
      });

      let newlyCreated = true;
      this.gc = this.dataset2.get('active').subscribe(v => {
        const id = this.id;
        if(!newlyCreated) return;
        console.log({id, newlyCreated, v});
        if(v==='true') this.scene.setFocus(this);
        newlyCreated = false;
      });


      const movable = new Movable(this);
      this.gc = movable.start();








      // SIZE SIGNAL
      // Create a ResizeObserver instance
      const resizeObserver = new ResizeObserver(this.#handleResizeMutation.bind(this));
      // Start observing the target element
      const card = this.shadowRoot.querySelector(`.card`);
      //
      resizeObserver.observe(card);
      this.gc = ()=> resizeObserver.disconnect();







      this.status.value = 'ready';
    }


    disconnected() {
      this.status.value = 'unloaded'; // ALERT THE PIPES
    }



    #handleResizeMutation(entries) {
      for (let entry of entries) {
        const width = entry.contentRect.width;
        const height = entry.contentRect.height;
        // console.log(`Element resized:`, [width, height]);
        this.sizeSignal.value = [width, height];
      }
    }

  getPortElement(id) {
    return this.shadowRoot.querySelector(`#port-${id}`);
  }

  #previousStyle = null;
  changeCardStyle(cardNode, newStyle){
    //console.log('CCC changeCardStyle', cardNode, newStyle);
    if(this.#previousStyle) CardStyles.remove(cardNode, this.#previousStyle);
    CardStyles.add(cardNode, newStyle);
    this.#previousStyle = newStyle;
  }

    get scene(){
      return transcend(this, `x-scene`);
    }








  }


  class CardStyles {
    static styles = {
      'solid-primary': ['text-bg-primary'],
      'solid-secondary': ['text-bg-secondary'],
      'solid-success': ['text-bg-success'],
      'solid-danger': ['text-bg-danger'],
      'solid-warning': ['text-bg-warning'],
      'solid-info': ['text-bg-info'],
      'solid-light': ['text-bg-light'],
      'solid-dark': ['text-bg-dark'],
      'border-primary': ['border-primary'],
      'border-secondary': ['border-secondary'],
      'border-success': ['border-success'],
      'border-danger': ['border-danger'],
      'border-warning': ['border-warning'],
      'border-info': ['border-info'],
      'border-light': ['border-light'],
      'border-dark': ['border-dark'],
    }

    static remove(element, styleName){
      if(!this.styles[styleName]) return; //NOTE: nominal style will be skipped here
      const styleClasses = this.styles[styleName];
      styleClasses.forEach(o=>element.classList.remove(o));
    }
    static add(element, styleName){
      if(!this.styles[styleName]) return; //NOTE: nominal style will be skipped here
      const styleClasses = this.styles[styleName];
      styleClasses.forEach(o=>element.classList.add(o));
    }

  }
