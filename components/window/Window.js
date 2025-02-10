import Signal from 'signal';
import Forms from 'forms';
import lol from 'lol';

import Movable from './Movable.js';
import Focusable from './Focusable.js';

import ReactiveHTMLElement from '../ReactiveHTMLElement.js';
export default class Window extends ReactiveHTMLElement {

  initialize() {
    this.Forms = new Forms({gc: this.gc});

    this.sizeSignal = new Signal([0,0]);
    this.attachShadow({ mode: 'open' });
    const localStyle = `
      .card {
        min-width: 16rem;
      }
      .card.active {
        border-color: var(--bs-primary) ! important;
      }
    `;
    this.styles(localStyle);
  }

  connected() {

    // creating a container for the editable-list component
    const cardNode = document.createElement('div');



    // adding a class to our container for the sake of clarity
    cardNode.classList.add('card', 'shadow', 'position-absolute');

    // creating the inner HTML of the editable list element
    cardNode.innerHTML = `
      <div class="card-header cursor-default user-select-none px-2">
        <span class="card-title"></span>
      </div>
      <ul class="list-group list-group-flush">
      </ul>
      <div class="card-footer text-body-secondary" style="font-size: .75rem">
        <span class="card-state opacity-50"></span>

      </div>
    `;

    // appending the container to the shadow DOM
    this.shadowRoot.appendChild(cardNode);

    const cardHeader = this.shadowRoot.querySelector('.card-header');
    const cardFooter = this.shadowRoot.querySelector('.card-footer');
    const listGroup = this.shadowRoot.querySelector('.list-group');
    const cardTitle = this.shadowRoot.querySelector('.card-header .card-title');
    const cardState = this.shadowRoot.querySelector('.card-footer .card-state');

    this.dataset2.get('date').subscribe(v => cardFooter.textContent = v);
    this.dataset2.get('title').subscribe(v => cardTitle.textContent = v);
    this.source.state.name.subscribe(v => cardState.textContent = v);
    this.dataset2.get('note').subscribe(v => cardFooter.textContent = v);
    this.dataset2.get('zindex').subscribe(v => cardNode.style.zIndex = v);
    this.dataset2.get('style').subscribe(newStyle => this.changeCardStyle(cardNode, newStyle));

    // CREATE STANDARD PORTS
    //
    const channelMaker = (key, data, iolistItem = lol.li({class:'list-group-item bg-transparent'})) => {

      const dataset = Object.assign({ title:key, side: 'in', icon: 'circle', style:'event' }, data)

      const existingPort = listGroup.querySelector(`x-port[id=${key}]`);

      if(existingPort){
        for (const [k,v] of Object.entries(dataset) ){
          existingPort.dataset2.set(k,v);
        }
      }

      if(!existingPort){
        listGroup.appendChild(iolistItem);
        const portNode = lol['x-port']({ id: key, dataset});
        iolistItem.appendChild(portNode)
      }

    }

    // // CHANNELS
    // // IN AND OUT PORTS, special handling required
    // // CREATE A SHARED iolistItem
    // const ioPortMap = this.source.channels.filter(([name])=>name=='in'||name=='out');
    // if(ioPortMap.length){
    //   // NOTE: in/out ports share a lingle list-group-item
    //   const  = lol.li({class:'list-group-item bg-transparent'});
    //   listGroup.appendChild(iolistItem);
    //   for (const [channelName, channelConfiguration] of ioPortMap) {
    //     channelMaker(channelName, channelConfiguration.value, iolistItem);
    //   }
    // }
    // // NOW APPEND NON IO ITEMS
    // for (const [channelName, channelConfiguration] of this.source.channels.filter(([name])=>name!=='in'&&name!=='out')) {
    //   channelMaker(channelName, channelConfiguration.value);
    // }
    // // UPDATE ITEMS, NOTE: this will run once, but it is the same valeus, and they will be ignored.
    // this.gc = this.source.channels.subscribe((channelName, channelConfiguration) => {
    //   channelMaker(channelName, channelConfiguration);
    // });
    // // TODO: REWRITE THIS to just rely on subscribe, testing is the item is in or out, and have them share an iolistItem, for the rest append an item


    // CHANNELS
    let iolistItem = null;

    // Set up the subscription to handle all channel updates
    this.gc = this.source.channels.subscribe((channelName, channelConfiguration) => {

      // Check if this is the first IO port we're encountering
      if ((channelName === 'in' || channelName === 'out') && !iolistItem) {
        // Create the shared list item for IO ports
        iolistItem = lol.li({class: 'list-group-item bg-transparent'});
        listGroup.appendChild(iolistItem);
      }

      // Determine which container to use
      //NOTE: undefined will cause channelMaker to create a new list item
      const container = (channelName === 'in' || channelName === 'out') ? iolistItem : undefined;

      // Create or update the channel
      channelMaker(channelName, channelConfiguration, container);
    });




    // ADD PIPES FROM REFERENCED SCENE
    this.dataset2.get('reference').subscribe(reference => {
      // Create Button
      if(reference) cardHeader.appendChild(lol.i({ name:'open-referenced-scene' ,class:'bi bi-arrow-right-circle text-muted float-end cursor-pointer ms-2', on:{ click:()=> this.application.project.commander.sceneSelect({id:this.dataset2.get('reference').value}) }}))
      const referencedScene = this.application.source.get(reference);
      for( const element of referencedScene.children.filter(child=>child.dataset.get('incoming').value ) ){
        const portNode = lol['x-port']({ id: element.id, dataset:{title:element.dataset.get('title').value, side: 'start', icon: 'box-arrow-in-right'} });
        const listItem = lol.li({class:'list-group-item bg-transparent'}, portNode);
        listGroup.appendChild(listItem)
      }
    });

    // HEALTH signals.
    this.gc = this.source.health.subscribe(health=>this.changeCardStyle(cardNode, `border-${health}`));
    const flash = (port, indicator, normal) => {
      this.changePortStyle(port, `solid-${indicator}`)
      this.setTimeout(() => this.changePortStyle(port, `solid-${normal}`), 222);
    };
    this.gc = this.source.on('receive', name=>flash(name, 'warning', 'primary'));
    this.gc = this.source.on('send', name=>flash(name, 'info', 'primary'));


    // PRINT SETTINGS
    for (const [name, options] of this.source.settings.getSettingsList() ){
      const keyType = options.type.value;
      // const valueSignal = this.source.settings.get(name);
      const dataset = Object.assign({ side: 'in', icon: 'key', style:'setting' });
      const portNode = lol['x-port']({ id: name, dataset });
      const inputField = this.Forms.buildField({name,...options});
      const listItem = lol.li({class:'list-group-item bg-transparent'},   inputField);
      listGroup.appendChild(listItem)
    }

    // SELF EDITABILITY - SETTING PUMP
    if(this.source.constructor.name == 'SceneSettingComponent'){
      const options = new Signal([]); // Format example [ { value:'up', textContent:'Up' } ]
      const configuration = {
        type: new Signal('Enum'),
        label: new Signal('Setting Name'),
        data: new Signal(),
        name: 'setting',
        options,
      };
      // Populate options with "local variables" or Settings.
      const sceneName = this.application.source.activeLocation.value;
      const currentScene = this.application.source.get('main-project', sceneName);
      //
      this.gc = currentScene.settings.data.subscribe(v=>{
        const variableNames = Object.keys(v); // Take the names of settings object
        const formOptions = [];
        for( const variableName of variableNames){
          const value = variableName;
          const textContent = variableName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
          const formOption = { value, textContent };
          formOptions.push(formOption);
        }
        // update signal
        options.value = formOptions;
      });
      const inputField = this.Forms.buildField(configuration);
      const listItem = lol.li({class:'list-group-item bg-transparent'},   inputField);
      listGroup.appendChild(listItem)
    }

    // TOOLBAR BUTTONS
    cardHeader.appendChild(lol.i({ name:'remove-component' ,class:'bi bi-x-circle text-danger float-end cursor-pointer', on:{ click:()=> this.application.source.commander.windowDelete({id:this.id}) && this.scene.clearFocus() }}))
    // cardHeader.appendChild(lol.i({ name:'configure-component' ,class:'bi bi-wrench-adjustable-circle text-muted float-end cursor-pointer ms-2', on:{ click:()=> this.application.source.commander.windowRead({id:this.id}) }}))

    // SUBSCRIBE TO DIMENSIONS SPECIFIED IN DATASET
    this.dataset2.get('left').subscribe(v => cardNode.style.left = v + 'px');
    this.dataset2.get('top').subscribe(v => cardNode.style.top = v + 'px');
    this.dataset2.get('width').subscribe(v => cardNode.style.width = v + 'px');
    this.dataset2.get('height').subscribe(v => cardNode.style.height = v + 'px');

    // MAKE WINDOW FOCUSABLE
    const focusable = new Focusable(this);
    this.gc = focusable.start();

    // TODO: A UI COMMANDER WILL BE USED TO HANDLE UI CHANGES
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

    // MAKE WINDOW MOVABLE
    const movable = new Movable(this);
    this.gc = movable.start();

    // SIZE SIGNAL - Create a ResizeObserver instance
    const resizeObserver = new ResizeObserver(this.#handleResizeMutation.bind(this));
    const card = this.shadowRoot.querySelector(`.card`);
    resizeObserver.observe(card);
    this.gc = ()=> resizeObserver.disconnect();

    // ANNOUNCE READY - PIPES ARE WAITING
    this.status.value = 'ready';
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
    return this.shadowRoot.getElementById(id);
  }
  changePortStyle(portId, newStyle){
    const portElement = this.getPortElement(portId);
    portElement.setAttribute('data-style', newStyle);
  }

  // STYLE MANAGEMENT
  #previousStyle = null;
  changeCardStyle(cardNode, newStyle){
    if(this.#previousStyle) CardStyles.remove(cardNode, this.#previousStyle);
    CardStyles.add(cardNode, newStyle);
    this.#previousStyle = newStyle;
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
    if(!this.styles[styleName]) return; //NOTE: nominal/none/* style will be skipped here
    const styleClasses = this.styles[styleName];
    styleClasses.forEach(o=>element.classList.remove(o));
  }

  static add(element, styleName){
    if(!this.styles[styleName]) return; //NOTE: nominal/none/* style will be skipped here
    const styleClasses = this.styles[styleName];
    styleClasses.forEach(o=>element.classList.add(o));
  }

}
