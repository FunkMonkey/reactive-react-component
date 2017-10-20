import createSourceSubjects from '../utils/create-source-subjects';
import createBaseComponent from './create-base-component';

const isEqual = ( a, b ) => a === b;

export default function ( env, options ) {
  const BaseComponent = createBaseComponent( env, options );
  const sourceOptions = options.sources;
  const sinkOptions = options.sinks;

  class BridgeComponent extends BaseComponent {
    componentWillMount() {
      this._prevProps = this.props;

      super.componentWillMount();

      // sending out first props
      // TODO: do it here?
      for ( const sourceName in sourceOptions ) {
        const sourceOption = sourceOptions[sourceName];
        const propName = sourceOption.propName || sourceName;
        if ( propName in this.props )
          this._sources[sourceName].next( this.props[propName] );
      }
    }

    componentWillReceiveProps( nextProps ) {
      for ( const sourceName in sourceOptions ) {
        if ( !Object.prototype.hasOwnProperty.call( sourceOptions, sourceName ) )
          continue;

        const sourceOption = sourceOptions[sourceName];
        const propName = sourceOption.propName || sourceName;
        const comparer = sourceOption.comparer || isEqual;
        if ( propName in nextProps &&
             !comparer( nextProps[propName], this._prevProps[propName] ) )
          this._sources[sourceName].next( nextProps[propName] );
      }

      this._prevProps = nextProps;

      super.componentWillReceiveProps( nextProps );
    }

    createSources() {
      this._sources = createSourceSubjects( env.Observable, sourceOptions );
      return this._sources;
    }

    handleSinks( sinks ) {
      // give sink to prop (callback function) of the same name
      const sinkNames = Object.keys( sinks );
      for ( let i = 0; i < sinkNames.length; ++i ) {
        const sinkName = sinkNames[i];
        const sinkOption = sinkOptions && sinkOptions[sinkName];
        const propName = ( sinkOption && sinkOption.propName ) || sinkName;
        const sinkCB = this.props[propName];
        const sink = sinks[sinkName];
        if ( sinkCB && typeof sinkCB === 'function' ) {
          const subscription = sink.subscribe( sinkCB );
          this.compositeSubscription.add( subscription );
        }
      }
    }
  }

  return BridgeComponent;
}
