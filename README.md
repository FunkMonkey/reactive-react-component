# reactive-react-component

Create [React](https://reactjs.org/) components using [ES Observables](https://github.com/tc39/proposal-observable), f. ex. [RxJS 5](https://github.com/ReactiveX/rxjs).

This library provides two types of components, both of which are created using a definition function that receives source observables and must return a render observable and optional event observables (sinks):

- **Reactive Component** (reactive interface)
  - pass source observables once directly as props
  - pass observers / subjects once to receive event observables (sinks) from the component
- **Bridge Component** (non-reactive interface)
  - pass props as usual
      - for every prop a source observable is created internally and every prop update will emit a new event for the according observable
  - pass event listeners (callback functions) as usual
      - if an event observable with the same name exists, it will be subscribed to with the listener as the `onNext` function

This project is heavily inspired by [cycle-react](https://github.com/pH200/cycle-react) and [Cycle.js](https://cycle.js.org/).

## Example for a Reactive Component

### `create-reactive-component.js`

You can use any React-compatible and ES Observable compatible library. Do this once and never
think about it again.

```js
import { createReactiveComponent } from 'reactive-react-component';
import React from 'react';
import Rx from 'rxjs/Rx';

const env = { React, Observable: Rx.Observable };
export default createReactiveComponent.bind( null, env );
```

### `hello.js`

Create a reusable React component using a definition function that receives `sources` and returns `sinks` including the render observable `view` or `view$`.

```js
import Rx from 'rxjs/Rx';
import createReactiveComponent from './create-reactive-component';

function helloDef( sources ) {
  const onChange$ = new Rx.Subject();
  const name$ = onChange$.startWith('');

  const view$ = Rx.Observable.combineLatest( sources.greeting$, name$ )
    .map( [greeting, name] => (
      <div>
        <h1>{greeting}, {name}</h1>
        Your Name: <input onChange={onChange$.next.bind( onChange$ )} />
      </div>
       )
    );

  return {
    view$,
    onNameChange$: onChange$
   };
}

export default createReactiveComponent( {
  displayName: 'Hello',
  definition: helloDef
} );
```

`sources` are the exact same observables that the user passed in as props.

`view` / `view$` will be subscribed to in `componentWillMount` and unsubscribed
from in `componentWillUnmount`. It is the only observable that will be subscribed
to internally. The React component itself will only update, when it receives a new
element from this observable.

### `main.js`

Use the component with Observables.

```js
import React from 'react';
import ReactDOM from 'react-dom';
import Rx from 'rxjs/Rx';
import Hello from './hello';

const greeting$ = Rx.Observable.interval( 5000 )
                               .map( count => count % 2 === 0 ? 'Hey' : 'Ho' );

const onNameChange$ = new Rx.ReplaySubject( 1 ).switch();

ReactDOM.render( <Hello greeting$={greeting$} onNameChange$={onNameChange$} />,
                 document.querySelector( '.hello-container' ) );

onNameChange$.subscribe( name => console.log(`DEBUG: name changed to '${name}'`) );
```

Event observables (sinks) will not be automatically subscribed to, but simply
forwarded. Thus the subject `onNameChange$` receives the event observable of the
same name as the only element and then completes. We use the `switch` operator to
flatten the observable.

## Example for a Bridge Component
