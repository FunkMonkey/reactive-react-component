/* eslint class-methods-use-this: "off" */

import createBaseComponent from './create-base-component';

export default function ( displayName, definitionFn, options, env ) {
  const BaseComponent = createBaseComponent( displayName, definitionFn, options, env );

  class ReactiveComponent extends BaseComponent {

    createSources() {
      return this.props;
    }

    handleSinks( sinks ) {
      const sinkNames = Object.keys( sinks );
      for ( let i = 0; i < sinkNames.length; ++i ) {
        const sinkName = sinkNames[i];
        const sinkObserver = this.props[sinkName];
        if ( sinkObserver && typeof sinkObserver.next === 'function' ) {
          sinkObserver.next( sinks[sinkName] );
        }
      }
    }

    componentWillReceiveProps( ) {
      throw new Error( 'Reactive Components cannot receive new props!' );
    }

  }

  return ReactiveComponent;
}
