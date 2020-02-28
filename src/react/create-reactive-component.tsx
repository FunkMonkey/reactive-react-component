/* eslint class-methods-use-this: "off" */
// eslint-disable-next-line import/no-extraneous-dependencies
import React from 'react';

import { InternalComponent, IOptions, ISinks } from '../InternalComponent';
import IReactEnvironment from './IReactEnvironment';

export interface IReactSinks extends ISinks<React.ReactNode> {}

export interface IReactOptions<TSources = {},
  TSinks extends IReactSinks = IReactSinks,
  TInitialData = {}>
  extends IOptions<React.ReactNode, TSources, TSinks, TInitialData> {
  displayName: string;
  loadingTagName?: string;
}

export interface IComponentState {
  view: React.ReactNode,
  viewVersion: number
}

/**
 * Creates a reactive react Component
 *
 * @param env
 * @param options
 */
export default function create<TProps = {},
  TSources = {},
  TSinks extends IReactSinks = IReactSinks,
  TInitialData = {}>(
  env: IReactEnvironment,
  options: IReactOptions<TSources, TSinks, TInitialData>
) {
  const { displayName, definition } = options;

  if ( typeof displayName !== 'string' ) {
    throw new Error( 'Invalid displayName' );
  }
  if ( typeof definition !== 'function' ) {
    throw new Error( 'Invalid definition' );
  }


  // The option for the default root element type.
  const loadingTagName = options.loadingTagName || 'div';

  return class ReactiveReactComponent extends env.React.Component<TProps, IComponentState> {
    // eslint-disable-next-line react/static-property-placement
    public displayName: string;

    // Typescript doesn't allow these to fields to be private or protected
    public _component: InternalComponent<React.ReactNode, TProps, TSources, TSinks, TInitialData>;

    public _isMounted: boolean;

    constructor( props: TProps ) {
      super( props );
      this.state = { view: null, viewVersion: 0 };
      this.displayName = displayName;
      this._component = new InternalComponent( env, options, this.onViewUpdated.bind( this ) );
      this._component.mount( this.props );
      this._isMounted = false;
    }

    /**
     * Updates the  state and consequently re-renders,
     * whenever the InternalComponent received a view update.
     *
     * @param view
     * @param viewVersion
     */
    onViewUpdated( view: React.ReactNode, viewVersion: number ) {
      // setState only works when mounted
      if ( this._isMounted ) this.setState( { view, viewVersion } );
      else this.state = { view, viewVersion };
    }

    componentDidMount() {
      this._isMounted = true;
    }

    shouldComponentUpdate( nextProps: TProps ) {
      // we don't really know if the render was triggered by new props or new state
      // the component will compare them
      this._component.updateProps( nextProps );

      // a prop-update may not cause a re-render, thus we'll ask the InternalComponent
      return !this._component.viewIsUpToDate;
    }

    componentWillUnmount() {
      this._component.unmount();
    }

    /**
     * Renders the component. This happens, when the InternalComponent issues a view update
     * and this component sets the state accordingly.
     */
    render() {
      const view = this.state ? this.state.view : null;

      if ( view ) {
        // inform the InternalComponent about the rendering
        this._component.viewWasRendered( this.state.viewVersion );
        return view;
      }

      return env.React.createElement( loadingTagName );
    }
  };
}
