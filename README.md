# reactive-react-component

Create [React](https://reactjs.org/) components using [ES Observables](https://github.com/tc39/proposal-observable), f. ex. [RxJS 5](https://github.com/ReactiveX/rxjs).

This library provides two types of components, both of which are created using a
definition function that receives source observables and must return a render
observable and optional event observables (sinks):

- **Reactive Component** (reactive interface)
  - pass source observables (ingoing data) once as props
  - pass observers / subjects once as props to receive event observables (sinks, outgoing
    data) from the component
  - later prop updates will be ignored
- **Bridge Component** (non-reactive interface, uses observables internally)
  - pass props as usual
      - for every prop a source observable is created internally and every prop update will emit a new event for the according observable
  - pass event listeners (callback functions) as usual
      - if an event observable (sink) with the same name exists, it will be subscribed to with the listener as the `onNext` function

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

### `hello-def.js`

Create a definition function that receives `sources` and returns `sinks` including the render observable `view` or `view$`.

```js
import Rx from 'rxjs/Rx';
import React from 'react';

export default function ( sources ) {
  const onChange$ = new Rx.Subject();
  const name$ = onChange$.map( evt => evt.target.value ).startWith( '' );

  const view$ = Rx.Observable.combineLatest( sources.greeting$, name$ )
    .map( ( [greeting, name] ) => (
      <div>
        <h1>{greeting}: {name}</h1>
        Your Name: <input onChange={onChange$.next.bind( onChange$ )} />
      </div>
    ) );

  return {
    view$,
    onNameChange$: name$
  };
}
```

`sources` are the exact same observables that the user passed in as props.

`view` / `view$` will be subscribed to in `componentWillMount` and unsubscribed
from in `componentWillUnmount`. It is the only observable that will be subscribed
to internally. The React component itself will only update, when it receives a new
element from this observable.

### `hello-reactive.js`

Create a reusable React component using the definition function. Technically you
could do this in the same file as the definition function, but we want to re-use
our definition function later in the bridge component example.

```js
import createReactiveComponent from './create-reactive-component';
import definition from './hello-def';

export default createReactiveComponent( {
  displayName: 'Hello',
  definition
} );
```

### `main-reactive.js`

Use the component with Observables.

```js
import React from 'react';
import ReactDOM from 'react-dom';
import Rx from 'rxjs/Rx';
import Hello from './hello-reactive';

const greeting$ = Rx.Observable
  .interval( 3000 )
  .map( count => ( count % 2 === 0 ? 'Hey, my name is'
                                   : 'What, my name is' ) );

const onNameChange$ = new Rx.ReplaySubject( 1 ).switch();

ReactDOM.render( <Hello greeting$={greeting$} onNameChange$={onNameChange$} />,
  document.querySelector( '.container' ) );

// using sinks
onNameChange$.subscribe( name => console.log( `DEBUG: name changed to '${name}'` ) );
```

Event observables (sinks) will not be automatically subscribed to, but simply
forwarded. Thus the subject `onNameChange$` receives the event observable of the
same name as the only element and then completes. We use the `switch` operator to
flatten the observable. Better use a `ReplaySubject` in case you are subscribing
late.

## Example for a Bridge Component

### `create-bridge-component.js`

You can use any React-compatible and ES Observable compatible library. Do this once and never
think about it again. Use `createBridgeComponent` this time.

```js
import { createBridgeComponent } from 'reactive-react-component';
import React from 'react';
import Rx from 'rxjs/Rx';

const env = { React, Observable: Rx.Observable };
export default createBridgeComponent.bind( null, env );
```

### `hello-def.js`

No change here. You can use the same definition function!

Prop updates will automatically create events for source observables. For every
sink there is a check to see if a same-named event listener exists. This will happen in
`componentWillMount` (later added event listeners will be ignored for now). If
one exists, the according sink observable will be subscribed to with the event
listener as `onNext`. All subscriptions will be disposed on `componentWillUnmount`.

### `hello-bridge.js`

Create a reusable React component using the definition function. Technically you
could do this in the same file as the definition function.

```js
import createBridgeComponent from './create-bridge-component';
import definition from './hello-def';

export default createBridgeComponent( {
  displayName: 'Hello',
  definition,
  sources: {
    greeting$: { propName: 'greeting' }
  },
  sinks: {
    onNameChange$: { propName: 'onNameChange' }
  }
} );
```

For bridge components the names of the `sources` must be specified. This is needed
internally to divide the props into ingoing sources and outgoing sinks. Every source
entry may optionally have a `comparer` property that decides if the previous and
currently received prop value are equal in order to reduce the observable events.
If not provided, it defaults to `a === b`.

The `sinks` can optionally be specified, too.

For both `sources` and `sinks` a `propName` can be set to alter the outer prop
names.

### `main-bridge.js`

Use the component like any other component (without Observables).

```js
import React from 'react';
import ReactDOM from 'react-dom';
import Hello from './hello-bridge';

function onNameChange( name ) {
  console.log( `DEBUG: name changed to '${name}'` );
}

function updateGreeting( greeting ) {
  // updating the props for the root component, little counter-intuitive
  // but most likely not necessary in your case...
  ReactDOM.render( <Hello greeting={greeting} onNameChange={onNameChange} />,
                   document.querySelector( '.container' ) );
}

let count = 0;
window.setInterval( () => {
  count++;
  const greeting = count % 2 === 0 ? 'Hey, my name is' : 'What, my name is';
  updateGreeting( greeting );
}, 3000 );
```

Despite the definition function using `greeting$` as a source and providing
 `onNameChange$` as a sink, the props `greeting` and `onNameChange` are used
here, because we assigned `propName` in `hello-bridge.js`.
