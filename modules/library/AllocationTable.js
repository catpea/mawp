
class AllocationTable {

  #instances;

  constructor(){
    this.#instances = new Map();
  }

  keys(){ // as array, note getter
    return [...this.#instances.keys()];
  }
  values(){ // as array, note getter
    return [...this.#instances.values()];
  }

  get all(){ // as array, note getter
    return this.values();
  }

  delete(id){
    if(!this.#instances.has(id)) throw new Error(`Unable to delete, Source instance with id ${id} is not in AllocationTable.`)
    return this.#instances.delete(id);
  }
  has(id){
    return this.#instances.has(id);
  }
  get(id){
    if(!this.#instances.has(id)){
     throw new Error(`Source instance with id ${id} is not in AllocationTable: (${this.values().map(o=>o.id).join(', ')}).`)
    }
    return this.#instances.get(id);
  }

  set(id, instance){
    if(this.#instances.has(id)) throw new Error(`You may not re-initialize a node with the same ID.`)
    this.#instances.set(id, instance);
  }

}
const allocationTable = new AllocationTable();
export {allocationTable};
