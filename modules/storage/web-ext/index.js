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

    if(initializeListener) listener(this.#value);

    return () => this.unsubscribe(listener); /* Return Unsubscribe Funcion */
  }

  unsubscribe(listener) {
    this.#listeners = this.#listeners.filter((l) => l !== listener);
  }

  #notify() {
    this.#listeners.forEach((listener) => listener(this.#value));
  }

  set value(v) {
    if (this.#value == v) return;
    this.#value = v;
    this.#notify();
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
    const listener = event => event.key===key ? reply(event.newValue, event.oldValue):0;
    window.addListener('storage', listener);
    return ()=>window.removeListener('storage', listener);
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
const storageBridge = new StorageBridge();




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
  #SAVED = {message: "SAVED"};
  #disposables;

  constructor(columns) {
    columns = [...new Set(['signal', 'status'].concat(columns))]; // Ensure unique column names
    super(columns);
    this.#disposables = [];
  }

  setSignal(pathKey, value){
    if(this.hasSignal(pathKey)){
      this.getSignal(pathKey).value = value;
    }else{
      const signal = new Signal(value);
      this.add(pathKey, {signal, status: 0});
      this.listenTo(signal, value => storageBridge.storage.set({[pathKey]:value}).then(()=>this.setStatus(pathKey, this.#SAVED), (e)=>this.setStatus(pathKey, e)) );
      //TODO: listen to changes on the store.
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

}









class Memory {

  #separator;
  #table;

  constructor(){
    this.#separator = ":";
    this.#table = new SignalTable();
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

const memory = new Memory();







class Settings {
  #objectId;
  #memory;

  constructor(objectId, memory){
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
    this.signal(rowId, columnId).value = value;
  }

  subscribe(rowId, columnId='value', f){
    return this.signal(rowId, columnId).subscribe(f);
  }

  merge(o){
    Object.entries(o).forEach(([rowId, value])=>{
      if(value===Object(value)){
        Object.entries(value).forEach(([columnId, value])=>this.set(rowId, columnId, value))
      }else{
        this.set(rowId, 'value', value);
      }
    });
  }

}


export {memory, Settings};
