
export default class CompositeSubscription {
  constructor() {
    this._subscriptions = [];
    this.closed = false;
  }

  add( subscription ) {
    this._subscriptions.push( subscription );
  }

  unsubscribe() {
    if ( !this.closed ) {
      for ( let i = 0; i < this._subscriptions.length; ++i ) {
        this._subscriptions[i].unsubscribe();
        this.closed = true;
      }
    }
  }
}
