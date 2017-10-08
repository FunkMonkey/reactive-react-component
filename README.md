# reactive-react-component

Create [React](https://reactjs.org/) components using [ES Observables](https://github.com/tc39/proposal-observable), f. ex. [RxJS 5](https://github.com/ReactiveX/rxjs).

This project is heavily inspired by [cycle-react](https://github.com/pH200/cycle-react) and [Cycle.js](https://cycle.js.org/).

## Example

### `create-reactive-component.js`

You can use any React-compatible and ES Observable compatible library.

```js
import * as rrc from 'reactive-react-component';
import React from 'react';
import Rx from 'rxjs/Rx';

const env = { React, Observable: Rx.Observable };
export default rrc.createReactiveComponent.bind( null, env );
```

### `hello.js`

Create a reusable React component.

```js
import Rx from 'rxjs/Rx';
import createReactiveComponent from './create-reactive-component';

function helloDef( sources ) {
  const onChange$ = new Rx.ReplaySubject( 1 );
  const name$ = onChange$.startWith('');

  const view$ = Rx.Observable.combineLatest( sources.greeting$, name$ )
    .map( [greeting, name] => (
      <div>
        <h1>{greeting}, {name}</h1>
        Your Name: <input onChange={onChange$.next.bind( onChange$ )} />
      </div>
       )
    );

  return { view$ };
}

export default createReactiveComponent( {
  displayName: 'Hello',
  definition: helloDef
} );
```

### `main.js`

Use the component with Observables.

```js
import React from 'react';
import ReactDOM from 'react-dom';
import Rx from 'rxjs/Rx';
import Hello from './hello';

const greeting$ = Rx.Observable.interval( 5000 )
                               .map( count => count % 2 === 0 ? 'Hey' : 'Ho' );

ReactDOM.render( <Hello greeting$={greeting$} />,
                 document.querySelector( '.hello-container' ) );
```
