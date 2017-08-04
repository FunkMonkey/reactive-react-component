import createPropSubjects from './create-prop-subjects';
import createBaseComponent from './create-base-component';

const isEqual = ( a, b ) => a === b;

export default function ( env, options ) {
  const BaseComponent = createBaseComponent( env, options );
  const { inProps } = options;

  class ReactComponent extends BaseComponent {
    componentWillMount() {
      this._prevProps = this.props;

      super.componentWillMount();

      // sending out first props
      // TODO: do it here?
      for ( const propName in inProps ) {
        if ( propName in this.props )
          this._sources[propName].next( this.props[propName] );
      }
    }

    componentWillReceiveProps( nextProps ) {
      for ( const propName in inProps ) {
        if ( !Object.prototype.hasOwnProperty.call( inProps, propName ) )
          continue;

        const comparer = inProps[propName].comparer || isEqual;
        if ( propName in nextProps &&
             !comparer( nextProps[propName], this._prevProps[propName] ) )
          this._sources[propName].next( nextProps[propName] );
      }

      this._prevProps = nextProps;

      super.componentWillReceiveProps( nextProps );
    }

    createSources() {
      this._sources = createPropSubjects( env.Observable, inProps );
      return this._sources;
    }

    handleSinks( sinks ) {
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
