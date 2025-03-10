import guid from 'guid';

class Signal {
  #value;
  #listeners;

  constructor(value) {
    this.#value = value;
    this.#listeners = [];
  }

  subscribe(listener) {
    this.#listeners.push(listener);

    let initializeListener = true;
    if(this.#value === undefined) initializeListener = false;
    if(this.#value === null) initializeListener = false;
    //console.log('HHHH Setting SUBSCRIPTION', {initializeListener}, this.#value, listener.toString())

    if(initializeListener) listener(this.#value, null);

    return () => this.unsubscribe(listener); /* Return Unsubscribe Funcion */
  }

  unsubscribe(listener) {
    this.#listeners = this.#listeners.filter((l) => l !== listener);
  }

  #notify(newValue, oldValue) {
    this.#listeners.forEach((listener) => listener(newValue, oldValue));
  }

  set value(newValue) {
    const oldValue = this.#value;
    if (oldValue == newValue) return;
    this.#value = newValue;
    this.#notify(newValue, oldValue);
  }

  get value() {
    return this.#value;
  }
}

class ExtensionStorage {

  #area;

  constructor(area){
    this.#area = area;
  }
  get(key){
    return browser.storage[this.#area].get(key);
  }
  set(o, ok, err){
    browser.storage[this.#area].set(o, ok, err);
  }
  remove(keys){
    browser.storage[this.#area].remove(keys);
  }
  clear(){
    browser.storage[this.#area].clear();
  }
  subscribe(key, reply){
    const listener = changes => key in changes ? reply(changes[key].newValue, changes[key].oldValue):0;
    browser.storage[this.#area].onChanged.addListener(listener);
    return ()=>browser.storage[this.#area].onChanged.removeListener(listener);
  }

}

class BrowserStorage {

  get(key){
    return localStorage.getItem(key);
  }
  set(o){
    for (const [key, value] of Object.entries(o)){
      localStorage.setItem(key, value);
    }
    return new Promise((resolve) =>  resolve());
  }
  remove(...o){
    for (const key of Object.entries(o.flat())){
      localStorage.removeItem(key);
    }
  }
  clear(){
    localStorage.clear()
  }

  subscribe(key, reply){

    //TODO: this is called too many times, turn this arround and write directly table.
    // const listener = event => event.key===key ? reply(event.newValue, event.oldValue):0;
    const listener = event => {

      const correctKey = event.key===key;
      if(!correctKey) return;

      const changeOccured = event.newValue !== event.oldValue;
      if(!changeOccured) return;

      console.log('Storage change', key, event.newValue, event.oldValue, event)
      reply(event.newValue, event.oldValue);
    };

    window.addEventListener('storage', listener);
    return ()=>window.removeEventListener('storage', listener);
  }

}

class StorageBridge {

  storage;

  constructor(){
    if(globalThis.browser){
      this.storage = new ExtensionStorage('local');
    }else{
      this.storage = new BrowserStorage();
    }
  }
}





class Table {
  constructor(columns) {
    this.columns = [...new Set(columns)].filter(o=>o); // Ensure unique column names
    this.data = new Map(); // Use Map for efficient access
  }

  /**
   * Adds a new row to the table.
   * @param {Object} rowData - An object containing the row data.
   * @returns {number} - The ID of the newly added row.
   */
  add(rowId, newRow) {
    const missingColumns = this.columns.filter(column => !(column in newRow));
    if (missingColumns.length > 0) throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
    // TODO: properly check columns
    this.data.set(rowId, newRow);
    return rowId;
  }

  update(rowId, column, value){
    if(!this.data.has(rowId)) throw new Error('Row ID not found');
    const object =  this.data.get(rowId);
    object[column] = value;
    // TODO: properly check columns
    this.data.set(rowId, object)
  }

  /**
   * Retrieves a row by its ID.
   * @param {number} rowId - The ID of the row to retrieve.
   * @returns {Object|undefined} - The row data if found; otherwise, undefined.
   */
  get(rowId) {
    if(! this.data.has(rowId)) console.error('no such rowId', rowId, this.data);
    return this.data.get(rowId);
  }

  /**
   * Deletes a row by its ID.
   * @param {number} rowId - The ID of the row to delete.
   * @returns {boolean} - True if the row was deleted; otherwise, false.
   */
  delete(rowId) {
    return this.data.delete(rowId);
  }

  /**
   * Checks if a row exists by its ID.
   * @param {number} rowId - The ID of the row to check.
   * @returns {boolean} - True if the row exists; otherwise, false.
   */
  has(rowId) {
    return this.data.has(rowId);
  }

  /**
   * Returns the number of rows in the table.
   * @returns {number} - The number of rows.
   */
  size() {
    return this.data.size;
  }

  /**
   * Clears all rows from the table.
   */
  clear() {
    this.data.clear();
  }

  /**
   * Iterates over all rows in the table.
   * @param {Function} callback - A callback function to execute for each row.
   */
  forEach(callback) {
    for (const row of this.data.values()) {
      callback(row);
    }
  }

}

class SignalTable extends Table {
  #db;
  #SAVED = {message: "SAVED"};
  #disposables;

  constructor(columns, db) {
    columns = [...new Set(['signal', 'status',  ].concat(columns))]; // Ensure unique column names
    super(columns);
    this.#db = db;
    this.#disposables = [];
    console.warn('I need a stop() to cleanup disposables!')
  }

  setSignal(pathKey, value){


    if(this.hasSignal(pathKey)){
    // if(value !== undefined || value !== null) return;
      this.getSignal(pathKey).value = value;
    }else{
      const signal = new Signal(value);

      // console.log('add pathKey', pathKey)
      this.add(pathKey, {signal, status: 0, typeof: typeof value});

      if(this.#db){
        this.listenTo(signal, value => this.#db.storage.set({[pathKey]:JSON.stringify(value)}).then(()=>this.setStatus(pathKey, this.#SAVED), (e)=>this.setStatus(pathKey, e)) );
      }


      if(this.#db){
        //Listen to changes on the store, where the values have been serialized.
        // const storageListener = db.storage.subscribe(pathKey, v=> signal.value = this.cast(v, typeof value) );
        const storageListener = this.#db.storage.subscribe(pathKey, v => {
          // console.log('Storage bridge reports change on pathKey, casting...', pathKey, v, this.cast(v, typeof value))
          // console.log('Incoming data from remote instance:', pathKey, v, this.cast(v, typeof value), typeof value, this.get(pathKey))
          console.log('Incoming data from remote instance:', pathKey, v, JSON.parse(v))

          // signal.value = this.cast(v, typeof value);
          signal.value = JSON.parse(v);

        });
        this.#disposables.push(storageListener);
      }

    }
  }

  setStatus(pathKey, status){
    this.update(pathKey, 'status', status);
  }

  hasSignal(pathKey){
    return this.has(pathKey);
  }

  getSignal(pathKey){
    if(! this.has(pathKey) ) this.setSignal(pathKey); // in signal world we do wikiwiki things
    return this.get(pathKey).signal;
  }

  // Utility Funcions
  //
  listenTo(signal, handler){
    const dispose = signal.subscribe(handler);
    this.#disposables.push(dispose)
  }

  // cast(v, type) {
  //   let response;

  //   switch (type) {
  //     case 'string':
  //       response = String(v);
  //       break;

  //     case 'number':
  //       response = Number(v);
  //       break;

  //     case 'boolean':
  //       response = v === 'true' ? true : false;
  //       break;

  //     case 'object':
  //       // Assuming the object was serialized as JSON
  //       try {
  //         response = JSON.parse(v);
  //       } catch (e) {
  //         response = null; // Or handle the error differently if needed
  //       }
  //       break;

  //     case 'undefined':
  //       response = undefined;
  //       break;

  //     case 'function':
  //       // Functions are too complex to restore from a string reliably
  //       response = null;
  //       break;

  //     default:
  //       // Handle other types as needed (e.g., BigInt, Symbol, etc.)
  //       response = v;
  //   }

  //   return response;
  // }

}









class Memory {

  #separator;
  #table;

  constructor(db){
    this.#separator = ":";
    this.#table = new SignalTable([], db);
  }

  has(objectId, rowId, columnId){
    const pathKey = this.keyOf(objectId, rowId, columnId);
    return this.#table.hasSignal(pathKey);
  }

  get(objectId, rowId, columnId){
    const pathKey = this.keyOf(objectId, rowId, columnId);
    return this.#table.getSignal(pathKey);
  }

  set(objectId, rowId, columnId, value){
    const pathKey = this.keyOf(objectId, rowId, columnId);
    this.#table.setSignal(pathKey, value);
  }

  // just make a key
  // TODO: this needs to include applicaion name and memory version ex: cede:m4
  keyOf(objectId, rowId, columnId){
    const pathKey = [objectId, rowId, columnId].join(this.#separator);
    return pathKey;
  }

}








class Settings {
  #objectId;
  #memory;

  constructor(objectId=guid(), memory = new Memory()){
    this.#objectId = objectId;
    this.#memory = memory;
  }

  signal(rowId, columnId='value'){
    return this.#memory.get(this.#objectId, rowId, columnId);
  }

  has(rowId, columnId='value'){
    return this.#memory.has(this.#objectId, rowId, columnId);
  }

  get(rowId, columnId='value'){
    return this.signal(rowId, columnId).value;
  }

  set(rowId, columnId='value', value){
    if(value === undefined){
     throw new Error('Value should not be set to undefined');
    }

    this.signal(rowId, columnId).value = value;
  }

  subscribe(rowId, columnId='value', f){
    return this.signal(rowId, columnId).subscribe(f);
  }

  assignValues(o){
    Object.entries(o).forEach(([rowId, value])=>{
      if(value===Object(value)){
        Object.entries(value).forEach(([columnId, value])=>this.set(rowId, columnId, value))
      }else{
        const columnId = 'value';
        this.set(rowId, columnId, value);
      }
    });
  }

  initializeDefaults(o){
    Object.entries(o).forEach(([rowId, value])=>{
      const valueIsAnObject = value===Object(value);
      if(valueIsAnObject){
        Object.entries(value).forEach(([columnId, value])=>{

          if(!this.has(rowId, columnId)){
            this.set(rowId, columnId, value)
          }else{
            // console.log('THWACK: initializing defaults twice, that is a non-no', [rowId, columnId].join('/'), this.get(rowId, columnId), value)
            throw new Error(`Can't initialize data twice, you were trying to set ${[rowId, columnId].join('/')} again.`)
            // this.set(rowId, columnId, value)
          }

          })
      }else{
        const columnId = 'value';
        if(!this.has(rowId, columnId,)){
          this.set(rowId, columnId, value);
        }else{
          // console.log('THWACK: initializing defaults twice, that is a non-no', [rowId, columnId].join('/'), this.get(rowId, columnId), value)
          throw new Error(`Can't initialize data twice, you were trying to set ${[rowId, columnId].join('/')} again.`)
          // this.set(rowId, columnId, value);

        }

      }
    });
  }

}

// this is the main memory, it is persistent, and a singleton
const memory = new Memory(new StorageBridge());
export {memory, Settings};
