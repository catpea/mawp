export default class Focusable {

  constructor(windowComponent) {
    this.windowComponent = windowComponent;



    this.cardElement = this.windowComponent.shadowRoot.querySelector(".card");
    this.mouseDownHandler = this.mouseDownHandler.bind(this);
  }

  start() {
    //console.log('Focusable start!', this.cardElement);
    this.cardElement.addEventListener('mousedown', this.mouseDownHandler);
    this.unlistenActive = this.windowComponent.dataset2.get('active').subscribe(v => this.activeHandler(v));

    return () => this.stop();
  }

  stop() {
    this.unlistenActive()
    this.cardElement.removeEventListener('mousedown', this.mouseDownHandler);
  }

  mouseDownHandler(event) {
    this.setFocus();
  }

  activeHandler(v) {
      const cardNode = this.windowComponent.shadowRoot.querySelector('.card');

    if(v==='true'){
      cardNode.classList.add('active')
      this.setFocus();
    }else{
      cardNode.classList.remove('active')

    }
  }

  setFocus(){
    //console.log(`Focusable mouseDownHandler for ${this.windowComponent.id}`);


    const windowGroup = Array.from(this.windowComponent.scene.children)
      .filter(o=>o.tagName.toLowerCase() == `x-window`)
      //NOTE: do not filter the self out: .filter(o=>o.id !== this.windowComponent.id)

    /// .map(o=>o.instance.searchShadow('.perspective').pop()).filter(e => e)

    // console.dir(children.map(o=>o.id));

    // Normalizing z-index: It ensures that any elements without a defined z-index are assigned one based on their order.
    for (const [index, win] of windowGroup.entries()) {
      if(win.dataset.zindex === undefined) win.dataset.zindex=index;
    }

    // Finding the Topmost z-index: It calculates the maximum z-index among the children to determine the next available z-index.
    let newTopmost = Math.max( ...windowGroup.map(o=>parseInt(o.dataset.zindex)) ) + 1;

    console.dir(windowGroup.map(o=>[o.id, o.dataset.zindex]));
    //console.log('new topmost is', newTopmost);

    // Setting the Selected Element: It updates the z-index of the selected element to be one higher than the current maximum.
    this.windowComponent.dataset.zindex = newTopmost;

    windowGroup.filter(o=>o.id !== this.windowComponent.id).filter(o=>o.dataset.active != 'false').map(o=>o.dataset.active = 'false');
    if(this.windowComponent.dataset.active != 'true') this.windowComponent.dataset.active = 'true';

    // Reindexing: Finally, it sorts the children by their z-index and applies a zero-based numbering scheme.
    for (const [index, win] of [...windowGroup].sort((a,b)=>parseInt(a.dataset.zindex) - parseInt(b.dataset.zindex) ).entries()) {
      const oldValue = parseInt(win.dataset.zindex);
      const newValue = index;
      if(oldValue !== newValue){
        win.dataset.zindex = newValue;
      }
    }
    console.dir(windowGroup.map(o=>[o.id, o.dataset.zindex]));

  }



}
