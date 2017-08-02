export default function ( rx4Observable ) {
  return {
    subscribe( observer ) {
      const rx4Observer = {
        onNext( val ) { observer.next( val ); },
        onError( err ) { observer.error( err ); },
        onCompleted() { observer.complete(); }
      };

      const rx4Subscription = rx4Observable.subscribe( rx4Observer );

      return {
        unsubscribe() {
          rx4Subscription.dispose();
        }
      };
    }
  };
}
