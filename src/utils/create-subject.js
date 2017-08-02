export default function createSubject( Observable ) {
  const observers = [];
  const subject = new Observable( observer => {
    observers.push( observer );
    return () => {
      const idx = observers.indexOf( observer ); // TODO: handle same observer
      observers.splice( idx, 1 );
    };
  } );

  subject.next = val => observers.forEach( obs => obs.next( val ) );
  subject.error = err => observers.forEach( obs => obs.error( err ) );
  subject.complete = () => observers.forEach( obs => obs.complete( ) );

  return subject;
}
