/* eslint class-methods-use-this: "off" */

import Component from '../component';

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
    constructor( props ) {
      super( props );
      this.state = { view: null, viewVersion: 0 };
      this.displayName = displayName;
      this._component = new Component( env, options, this.onViewUpdated.bind( this ) );
      this._component.mount( this.props );
    }

    onViewUpdated( view, viewVersion ) {
      this.setState( { view, viewVersion } );
    }

    componentDidMount() {
      // this.lifecycles.componentDidMount.next();
    }

    shouldComponentUpdate() {
      return this._component.shouldUpdate();
    }

    /* componentWillUpdate( nextProps ) {
      this.lifecycles.componentWillUpdate.next( nextProps );
    }

    componentDidUpdate( prevProps ) {
      this.lifecycles.componentDidUpdate.next( prevProps );
    } */

    componentWillUnmount() {
      /* this.lifecycles.componentWillMount.complete();
      this.lifecycles.componentDidMount.complete();
      this.lifecycles.componentWillReceiveProps.complete();
      this.lifecycles.componentWillUpdate.complete();
      this.lifecycles.componentDidUpdate.complete();
      this.lifecycles.componentWillUnmount.next();
      this.lifecycles.componentWillUnmount.complete(); */
      this._component.unmount();
    }

    render() {
      // we don't really know if the render was triggered by new props or new state
      // the component will compare them
      this._component.updateProps( this.props );

      const view = this.state ? this.state.view : null;

      if ( view ) {
        this._component.updateComponent( this.state.viewVersion );
        return view;
      }

      return env.React.createElement( rootTagName );
    }
  }

  if ( options.propTypes ) {
    BaseComponent.propTypes = options.propTypes;
  }

  return BaseComponent;
}
