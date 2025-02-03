class Base {

  start(){
    return ()=>this.stop();
  }

  stop(){
    this.dispose();
  }

  dispose(){
    this.collectGarbage()
  }

    // STANDARD GARBAGE COLLECTION
  #garbage = [];
  collectGarbage(){
    this.#garbage.map(s=>s.subscription())
  }
  set gc(subscription){ // shorthand for component level garbage collection
    this.#garbage.push( {type:'gc', id:'gc-'+this.#garbage.length, ts:(new Date()).toISOString(), subscription} );
  }

}

class Dropdown extends Base {

  constructor(element, options){
    super();
    const root = element.parentElement;

      const dropdownToggle = root.querySelector('.dropdown-toggle');
      const dropdownMenu = root.querySelector('.dropdown-menu');

      const activateButton = () => {
        const buttonHeight = dropdownToggle.getBoundingClientRect().height + 2;
        dropdownToggle.classList.toggle('show');
        dropdownMenu.classList.toggle('show');
        if( dropdownMenu.classList.contains('show') ){
          dropdownMenu.setAttribute('style', `position: absolute; inset: 0px auto auto 0px; margin: 0px; transform: translate(0px, ${buttonHeight}px);`);
        }else{
          dropdownMenu.removeAttribute('style');
        }
      }
      const deactivateButton = (e) => {
        if ( e.explicitOriginalTarget == dropdownToggle ) return;
        dropdownToggle.classList.remove('show');
        dropdownMenu.classList.remove('show');
        dropdownMenu.removeAttribute('style');
      }

      dropdownToggle.addEventListener("click", activateButton);
      this.gc = () => dropdownToggle.removeEventListener("click", activateButton);

      document.addEventListener("click", deactivateButton);
      this.gc = () => document.removeEventListener("click", deactivateButton);
      document.addEventListener("wheel", deactivateButton);
      this.gc = () => document.removeEventListener("wheel", deactivateButton);
      document.addEventListener("contextmenu", deactivateButton);
      this.gc = () => document.removeEventListener("contextmenu", deactivateButton);

  }

}

export default { Dropdown };
