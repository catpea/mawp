export default class Children {

  #allocationTable; // reverence to the central place that holds object instances
  #signal; // the children signal of the current node

  constructor(allocationTable, signal){
    if(!allocationTable) throw new Error('Allocation table is required')
    this.#allocationTable = allocationTable;
    this.#signal = signal;
  }

  subscribe(f){
    return this.#signal.subscribe(f);
  }

  append(id){
    if(typeof id !== 'string') throw new TypeError('You must specify a string id');
    if( this.#signal.value && this.has(id) ) return;
    // NOTE: we are performing an asignment to the signal
    // NOTE: we must not prefix by space an empty value
    this.#signal.value = this.#signal.value?this.#signal.value + ' ' + id:id;
  }

  remove(id){
    if(typeof id !== 'string') throw new TypeError('You must specify a string id');
    // NOTE: we are performing an asignment to the signal
    this.#signal.value = this.keys().filter(o=>o!==id).join(' ');
    // NOTE: less robust but faster method:
    // it expects well formed strings, with one space as separator.
    // this.#signal.value = (this.#signal.value + ' ').replaceAll(id + ' ', '').trimEnd();
  }

  keys(){
    if(this.#signal.value === undefined) return [];
    return this.#signal.value.split(/\s+/);
  }

  values(){
    return this.keys().map(id => this.#allocationTable.get(id));
  }

  [Symbol.iterator]() {
    return this.values()[Symbol.iterator]()
  }

  get length(){ return this.keys().length }


  has(id){
    if(typeof id !== 'string') throw new TypeError('You must specify a string id');
    return this.keys().includes(id);
  }

  get(id){
    if(!this.has(id)) throw new TypeError(`Not Found: ${id} (${this.#signal.value})`);
    if(this.#allocationTable.keys().length == 0) throw new Error(`Allocation Table Is Empty (attempting to load "${id}")`);

    console.log('HAS', id, this.has(id), this.keys().includes(id), this.keys(), this.#allocationTable.keys())
    return this.#allocationTable.get(id);
  }

  filter(...a){ return this.values().filter(...a) }

  // map(...a){ return this.#signal.value.split(/\s+/).map(...a) }
  // reduce(...a){ return this.#signal.value.split(/\s+/).reduce(...a) }

  // sort(...a){ return this.#signal.value.split(/\s+/).sort(...a) }
  // find(...a){ return this.#signal.value.split(/\s+/).find(...a) }


}
