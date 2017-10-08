/* eslint class-methods-use-this: "off" */

import CompositeSubscription from '../utils/composite-subscription';
import createLifecycleSubjects from './create-lifecycle-subjects';

export default function ( env, options ) {
  const { displayName, definition } = options;

  if ( typeof displayName !== 'string' ) {
    throw new Error( 'Invalid displayName' );
  }
  if ( typeof definition !== 'function' ) {
    throw new Error( 'Invalid definition' );
  }

  // The option for the default root element type.
  const rootTagName = options.rootTagName || 'div';

  class BaseComponent extends env.React.Component {
    constructor() {
      super();
      this.state = { newView: null };
      this.displayName = displayName;
    }

    componentWillMount() {
      this._subscribeReactiveComponent();
      this.lifecycles.componentWillMount.next();
    }

    componentDidMount() {
      this.lifecycles.componentDidMount.next();
    }

    componentWillReceiveProps( props ) {
      this.lifecycles.componentWillReceiveProps.next( props );
    }

    shouldComponentUpdate( nextProps, nextState ) {
      // Only care about the state since the props have been observed.
      return this.state !== nextState;
    }

    componentWillUpdate( nextProps ) {
      this.lifecycles.componentWillUpdate.next( nextProps );
    }

    componentDidUpdate( prevProps ) {
      this.lifecycles.componentDidUpdate.next( prevProps );
    }

    componentWillUnmount() {
      this.lifecycles.componentWillMount.complete();
      this.lifecycles.componentDidMount.complete();
      this.lifecycles.componentWillReceiveProps.complete();
      this.lifecycles.componentWillUpdate.complete();
      this.lifecycles.componentDidUpdate.complete();
      this.lifecycles.componentWillUnmount.next();
      this.lifecycles.componentWillUnmount.complete();
      this._unsubscribeReactiveComponent();
    }

    _subscribeReactiveComponent() {
      const sources = this.createSources();
      this.compositeSubscription = new CompositeSubscription();

      this.lifecycles = createLifecycleSubjects( env.Observable );

      this.sinks = definition( sources, this.lifecycles, this );

      const view$ = this.sinks.view || this.sinks.view$;
      const renderSubscription = view$.subscribe( newView => {
        this.setState( { newView } );
      } );

      this.compositeSubscription.add( renderSubscription );

      this.handleSinks( this.sinks );
    }

    _unsubscribeReactiveComponent() {
      this.compositeSubscription.unsubscribe();
    }

    render() {
      const vtree = this.state ? this.state.newView : null;

      if ( vtree ) {
        return vtree;
      }
      return env.React.createElement( rootTagName );
    }
  }

  if ( options.propTypes ) {
    BaseComponent.propTypes = options.propTypes;
  }

  return BaseComponent;
}
