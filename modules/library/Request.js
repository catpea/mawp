
export class DataRequest {
  pipe = {id:null}
  from = { id: null, port: null };
  to = { id: null, port: null };
  source = null;
  destination = null;
  constructor(context) {
    this.pipe.id = context.id;

    if( (!context.settings.get('from', 'value'))||(!context.settings.get('to', 'value')) ) throw new Error(`Data request from ${context.id} is invalid as from||to is empty`);

    // TODO: unknown.. cache and make reactive...
    Object.assign( this.from, Object.fromEntries( [context.settings.get('from', 'value').split(":")] .map(([id, port]) => [ ["id", id], ["port", port], ]) .flat(), ), );
    Object.assign( this.to, Object.fromEntries( [context.settings.get('to', 'value').split(":")] .map(([id, port]) => [ ["id", id], ["port", port], ]) .flat(), ), );

    this.source = context.parent.get(this.from.id);
    this.destination = context.parent.get(this.to.id);
  }
}

export class ConnectionRequest extends DataRequest {

}

export class TransportationRequest extends DataRequest {

  data = null;
  options = null;
  constructor(context, data, options) {
    super(context);
    this.data = data;
    this.options = options;
  }

}
