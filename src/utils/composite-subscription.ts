import { ISubscription } from '../IObservable';

export default class CompositeSubscription {
  _subscriptions: ISubscription[];
  closed: boolean;

  constructor() {
    this._subscriptions = [];
    this.closed = false;
  }

  add( subscription: ISubscription ) {
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
