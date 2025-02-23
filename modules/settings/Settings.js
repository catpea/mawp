class Setting {
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

export default class Settings {

  #db;

  constructor(merge){
    this.#db = new Map();
    if(merge) this.merge(merge);
  }

  merge(object){
    for ( const [key, value] of Object.entries(object)){
      if(this.isPrimitive(value)){
        this.addKey(key, value);
      }else{
        this.addRow(key, value);
      }
    }
  }

  getField(a, b){
    if(!b) [a, b] = a.split(':');
    return this.signal(a, b);
  }

  setValue(key, value){
    const rowId = key;
    const columnName = 'value';
    return this.#upsertField(rowId, columnName, value);
  }

  getValue(key, columnName='value'){
    const rowId = key;
    return this.#upsertField(rowId, columnName).value;
  }

  addKey(key, value){
    const rowId = key;
    const columnName = 'value';
    return this.#upsertField(rowId, columnName, value);
  }

  addRow(rowId, rawRowObject){
    for ( const [columnName, value] of Object.entries(rawRowObject)){
      const signal = this.#upsertField(rowId, columnName, value);
    }
  }

  hasValue(rowId, columnName='value'){
    return this.has(rowId, columnName);
  }
  has(rowId, columnName){
    const invalidArgumentMessage = this.hasInvalidArguments(arguments, {rowId:'string', columnName:'string'});
    if(invalidArgumentMessage) throw new TypeError('Invald Funcion Arguments: ' + invalidArgumentMessage);

    const row = this.#db.get(rowId);
    const rowExists = row!==undefined;
    if(!rowExists) return false;

    const hasColumn = row.has(columnName);
    const isSetting = row.get(columnName) instanceof Setting;
    // const notUndefined = row.get(columnName).value ==! undefined;
     // row.get(columnName).value !== null
    const verdict = ( rowExists && hasColumn && isSetting );
    return verdict;
  }

  signal(rowId, columnName){
    return this.#upsertField(rowId, columnName);
  }

  get(rowId, columnName='value'){
    const row = this.#db.get(rowId);
    return row.get(columnName).value;
  }

  set(rowId, columnName, value){
    this.#upsertField(rowId, columnName, value);
  }

  #ensureRow(rowId) {

    if( this.#db.has(rowId) ){
      const row = this.#db.get(rowId);
      return row;
    } else {
      const row = new Map(); // NOTE: row data is not meant to be a signal, only fields are signals
      row.set('value', new Setting(null));

      this.#db.set(rowId, row);
      return row;
    }
  }

  #upsertField(rowId, columnName, fieldValue) {
    const invalidArgumentMessage = this.hasInvalidArguments(arguments, {rowId:'string', columnName:'string', fieldValue:()=>true});
    if(invalidArgumentMessage) throw new TypeError('Invald Funcion Arguments: ' + invalidArgumentMessage);

    const row = this.#ensureRow(rowId);
    const existingSignal = row.get(columnName);
    const exists = row.has(columnName) && existingSignal instanceof Setting;
    //console[exists?'info':'warn'](`HHH ${rowId}, ${columnName}`, exists?'exists':'not-exists')
    if (exists) {
      if(fieldValue === undefined){
        // noop
      }else if(fieldValue === null){
        // noop
      } else {
        existingSignal.value = fieldValue;
      }
      return existingSignal;
    }else{
      const signal = new Setting(fieldValue); // undefined is OK/ it is default
      row.set(columnName, signal);
      //console.log(`HHH ${rowId}, ${columnName} created` )

      return signal;
    }

  }

  ofCategory(category){
    return this.withColumn('category', category);
  }

  ofType(type){
    return this.withColumn('type', type);
  }

  /**
  Return Set that contains a column, optionally filter with optionalValue
  */
  withColumn(columnName, optionalValue){
    const response = new Map();
    for ( const [rowId, row] of this.#db ){
      const dataExists = this.has(rowId, columnName);
      if(dataExists){
        if(optionalValue){
          if(this.get(rowId, columnName) == optionalValue) response.set(rowId, row);
        }else{
          response.set(rowId, row);
        }
      }

    }
    return response;
  }

  withoutColumn(columnName){
    const response = new Map();
    for ( const [rowId, row] of this.#db ){

      const dataNotExists = !this.has(rowId, columnName);
      if(dataNotExists){
          response.set(rowId, row);
      }
    }
    return response;
  }

  // delete row is not allowed as it creates anomalies and concerns in what to send to a listener when a row is deleted, it cant be null as it poisons upstream with logic


  // #subscribers = new Map();
  // #notify(rowId, columnName, newValue, oldValue){
  //   if(!this.#subscribers.get(rowId)) return
  //   for ( const subscriber of this.#subscribers.get(rowId).get(columnName)){
  //     subscriber(newValue, oldValue);
  //   }
  // }

  subscribeToValue(rowId, subscriber){
    return this.subscribe(rowId, 'value', subscriber);
  }

  subscribe(rowId, columnName, subscriber){
    const invalidArgumentMessage = this.hasInvalidArguments(arguments, {rowId:'string', columnName:'string', subscriber:'function'});
    if(invalidArgumentMessage) throw new TypeError('Invald Funcion Arguments: ' + invalidArgumentMessage);

    // Subscription Created A Blank Field WikiWiki Style (This is a stub);
    // const createStub = !this.has(rowId, columnName);
    // if(createStub) this.#upsertField(rowId, columnName);

    // if(!this.#subscribers.has(rowId)) this.#subscribers.set(rowId, new Map());
    // if(!this.#subscribers.get(rowId).has(columnName)) this.#subscribers.get(rowId).set(columnName, new Set());
    // this.#subscribers.get(rowId).get(columnName).add(subscriber);
    // const dataExists = this.has(rowId, columnName);
    // console.log('HHH', {dataExists, value:this.get(rowId, columnName)})
    // if (dataExists){
      // subscriber(this.get(rowId, columnName));
    // }else{

    // }
    // return () => this.unsubscribe(rowId, columnName, subscriber);
    //

    const setting = this.#upsertField(rowId, columnName);
    return setting.subscribe( subscriber );
  }

  // once(rowId, columnName, subscriber){
  //   const unsubscriber = (...args) => {
  //     subscriber(...args);
  //     this.unsubscribe(rowId, columnName, unsubscriber);
  //   };
  //   this.subscribe(rowId, columnName, unsubscriber);
  // }

  // unsubscribe(rowId, columnName, subscriber){
  //   this.#subscribers.get(rowId).get(columnName).delete(subscriber);
  // }

  toObject(){
    const response = {};
    for ( const [id, row] of this.#db ){
      response[id] = {};
      for ( const [key, signal] of row.entries().filter(([key])=>key!=='id') ){
        response[id][key] = signal.value;
      }
    }
    return response;
  }
  toFields(mapObject){
    const response = {};
    for ( const [id, row] of this.#db ){
      if(!row.has('type')) continue;
      response[id] = {};
      for ( const [key, signal] of row.entries().filter(([key])=>key!=='id') ){
        response[id][key] = signal.value;
      }
      if(mapObject) response[id] = mapObject(response[id]);
    }
    return response;
  }

  isPrimitive(value) {
    return (
      value === null ||
      typeof value === 'boolean'||
      typeof value === 'number' ||
      typeof value === 'string' ||
      typeof value === 'symbol' ||
      typeof value === 'bigint' ||
      typeof value === 'undefined'
    );
  }


  hasInvalidArguments(functionArguments, argumentSchema) {
      const VALID = false;

      const argsObj = Array.from(functionArguments).reduce((acc, arg, index) => {
        acc[Object.keys(argumentSchema)[index]] = arg;
        return acc;
      }, {});

      for (const key in argumentSchema) {
        const validator = argumentSchema[key];
        const value = argsObj[key];

        if (!(key in argsObj) && !(typeof validator === 'function')) {
          return `Property missing: ${key}`;
        }



        if (validator === 'string' || validator === 'number' || validator === 'boolean' || validator === 'function') {
          if (typeof value !== validator) return `Type mismatch in ${key}: expected ${validator}, got ${typeof value}`;
        } else if (typeof validator === 'function') {
          if (!validator(value)) return `Custom validation failed for ${key}`;
        } else if (validator.prototype instanceof Object) {
          if (!(value instanceof validator)) return `Instance type mismatch in ${key}`;
        // } else if (validator === 'function') {
        } else {
          console.error(`Unhandled type or validator for ${key}`, validator, value);
          return `Unhandled type or validator for ${key}`;
        }
      }

      return VALID;
    } // isInvalid

}
