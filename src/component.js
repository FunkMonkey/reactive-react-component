import CompositeSubscription from './utils/composite-subscription';
import { isEqual, allPropsAreEqual } from './utils/equality';


/* eslint class-methods-use-this: "off" */
export default class Component {
  constructor( env, options, onNewView ) {
    this.env = env;
    this.options = options;
    this.directSources = 'directSources' in options && options.directSources;
    this.sourceNames = this.options.sourceNames;
    this.sinkNames = this.options.sinkNames;
    this.propIsEqual = this.options.propIsEqual || isEqual;
    this.allPropsAreEqual = this.options.allPropsAreEqual || allPropsAreEqual;

    this.view = null;
    this.onNewView = onNewView;
    this.viewVersion = 0;
    this.shouldUpdate = false;

    this.props = null;
    this.sources = null;
    this.sinks = null;
  }

  mount( firstProps ) {
    this.props = firstProps;
    this.compositeSubscription = new CompositeSubscription();

    this.sources = this.createSources( firstProps );

    this.sinks = this.options.definition( this.sources, this.lifecycles, this );
    this.handleSinks( this.sinks );

    // handle updated view
    const view$ = this.sinks.view || this.sinks.view$;
    const renderSubscription = view$.subscribe( newView => {
      this.view = newView;
      this.viewVersion++;
      this.shouldUpdate = true; // TODO: may trigger render before state was set resulting in two renders
      this.onNewView( this.view, this.viewVersion );
    } );

    this.compositeSubscription.add( renderSubscription );
  }

  createSources( firstProps ) {
    const sources = {};
    if ( this.directSources ) {
      this.sourceNames.forEach( sourceName => {
        sources[sourceName] = firstProps[sourceName];
      } );
    } else {
      this.sourceNames.forEach( sourceName => {
        sources[sourceName] = new this.env.ReplaySubject( 1 );
      } );

      Object.entries( firstProps ).forEach( ( [key, value] ) => sources[key].next( value ) );
    }

    return sources;
  }

  shouldComponentUpdate() {
    return this.shouldUpdate;
  }

  propsAreEqual( oldProps, newProps ) {
    return this.allPropsAreEqual( oldProps, newProps, this.propIsEqual );
  }

  updateProps( newProps ) {
    // TODO: remove
    // if ( this.propsAreEqual( this.props, newProps ) )
    //  return;

    // update sources if anything changed
    this.sourceNames.forEach( sourceName => {
      if ( sourceName in newProps && !this.propIsEqual( this.props[sourceName],
                                                        newProps[sourceName] ) ) {
        this.sources[sourceName].next( newProps[sourceName] );
        console.log( `updating prop${sourceName}` );
      }
    } );
    this.props = newProps;
    // update sinks if anything changed
    // TODO: handleSinks

    // console.log( "Props changed though they shouldn't" );
  }

  handleSinks( sinks ) {
    // give sink to prop (Observer) of the same name
    // TODO: allow callback functions, too?
    const sinkNames = Object.keys( sinks );
    for ( let i = 0; i < sinkNames.length; ++i ) {
      const sinkName = sinkNames[i];
      const sinkObserver = this.props[sinkName];
      if ( sinkObserver && typeof sinkObserver.next === 'function' ) {
        sinkObserver.next( sinks[sinkName] );
        sinkObserver.complete();
      }
    }
  }

  updateComponent( viewVersion ) {
    // the UI framework may not have updated to the newest version yet.
    // we adjust shouldUpdate only when we're there yet!
    this.shouldUpdate = viewVersion !== this.viewVersion;
  }

  unmount() {
    this.compositeSubscription.unsubscribe();
  }
}
