import createSourceSubjects from './create-source-subjects';
import createBaseComponent from './create-base-component';

const isEqual = ( a, b ) => a === b;

export default function ( env, options ) {
  const BaseComponent = createBaseComponent( env, options );
  const { sources } = options;

  class ReactComponent extends BaseComponent {
    componentWillMount() {
      this._prevProps = this.props;

      super.componentWillMount();

      // sending out first props
      // TODO: do it here?
      for ( const sourceName in sources ) {
        if ( sourceName in this.props )
          this._sources[sourceName].next( this.props[sourceName] );
      }
    }

    componentWillReceiveProps( nextProps ) {
      for ( const sourceName in sources ) {
        if ( !Object.prototype.hasOwnProperty.call( sources, sourceName ) )
          continue;

        const comparer = sources[sourceName].comparer || isEqual;
        if ( sourceName in nextProps &&
             !comparer( nextProps[sourceName], this._prevProps[sourceName] ) )
          this._sources[sourceName].next( nextProps[sourceName] );
      }

      this._prevProps = nextProps;

      super.componentWillReceiveProps( nextProps );
    }

    createSources() {
      this._sources = createSourceSubjects( env.Observable, sources );
      return this._sources;
    }

    handleSinks( sinks ) {
      // give sink to prop (callback function) of the same name
      const sinkNames = Object.keys( sinks );
      for ( let i = 0; i < sinkNames.length; ++i ) {
        const sinkName = sinkNames[i];
        const sinkCB = this.props[sinkName];
        const sink = sinks[sinkName];
        if ( sinkCB && typeof sinkCB === 'function' ) {
          const subscription = sink.subscribe( sinkCB );
          this.compositeSubscription.add( subscription );
        }
      }
    }
  }

  return ReactComponent;
}
