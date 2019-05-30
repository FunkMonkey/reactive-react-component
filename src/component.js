import CompositeSubscription from './utils/composite-subscription';
import { isEqual, allPropsAreEqual } from './utils/equality';


/* eslint class-methods-use-this: "off" */
export default class Component {
  Component( env, options, onNewView ) {
    this.env = env;
    this.options = options;

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

    // handle updated view
    const view$ = this.sinks.view || this.sinks.view$;
    const renderSubscription = view$.subscribe( newView => {
      this.view = newView;
      this.viewVersion++;
      this.shouldUpdate = true;
      this.onNewView( this.view, this.viewVersion );
    } );

    this.compositeSubscription.add( renderSubscription );
  }

  createSources( firstProps ) {
    // TODO: make indirect mode with Subject
    return firstProps;
  }

  componentShouldUpdate() {
    return this.shouldUpdate;
  }

  propsAreEqual( oldProps, newProps ) {
    return allPropsAreEqual( oldProps, newProps, isEqual );
  }

  updateProps( newProps ) {
    if ( this.propsAreEqual( this.props, newProps ) )
      return;

    console.log( "Props changed though they shouldn't" );
  }

  updateComponent( viewVersion ) {
    this.shouldUpdate = viewVersion !== this.viewVersion;
  }

  unmount() {
    this.compositeSubscription.unsubscribe();
  }
}
