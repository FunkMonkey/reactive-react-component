import CompositeSubscription from './utils/composite-subscription';
import { isEqual, IsEqual } from './utils/equality';
import { IObservable, ISubject } from './IObservable';

export type OnNewView = ( view: React.ReactNode, version: number ) => void;

export interface IEnvironment {
  createSubject(): ISubject<any>;
}

export interface ISinks<TNode>{
  view?: IObservable<TNode>; // TODO: make generic instead of using React
  view$?: IObservable<TNode>;
}

/**
 * Interface for the definition function that the user has written
 */
export type ComponentDefinition<TNode,
  TSources = {},
  TSinks extends ISinks<TNode> = ISinks<TNode>,
  TInitialData = {}> =
  ( sources: TSources, initialData?: TInitialData ) => TSinks;


export type ConvertSource = ( sourceName: string, source: IObservable<any> ) => IObservable<any>;
export type UpdateSource = ( sourceName: string, initialSource: IObservable<any>,
  newSource: IObservable<any> ) => void;

export interface IOptions<TNode,
  TSources = {},
  TSinks extends ISinks<TNode> = ISinks<TNode>,
  TInitialData = {}> {
  sourceNames: string[];
  sinkNames: string[];
  initialDataNames?: string[];
  propIsEqual?: IsEqual;

  definition: ComponentDefinition<TNode, TSources, TSinks, TInitialData>;
  convertSource?: ConvertSource;
  updateSource?: UpdateSource;
}


function stdConvertSource( _sourceName: string, source: IObservable<any> ) { return source; }
function stdUpdateSource( sourceName: string, _initialSource: IObservable<any>,
                          _newSource: IObservable<any> ) {
  console.log( `Update of source ${sourceName} ignored` );
}


/* eslint class-methods-use-this: "off" */
/**
 * InternalComponent provides logic for reactive UI components that can be shared between different
 * UI frameworks.
 *
 * Currently we need to cast the template parameters to Records as TS doesn't support implicit
 * index signatures for interfaces. For a clean API, we don't expect the given interfaces for
 * props, sources and sinks to have index signatures.
 * See also: https://github.com/Microsoft/TypeScript/issues/15300
 */
export class InternalComponent<TNode,
  TProps = {},
  TSources = {},
  TSinks extends ISinks<TNode> = ISinks<TNode>,
  TInitialData = {}> {
  // environment
  protected env: IEnvironment;

  // options
  protected options: IOptions<TNode, TSources, TSinks, TInitialData>;

  protected sourceNames: string[];

  protected sinkNames: string[];

  protected propIsEqual: IsEqual;

  // in/out
  // eslint-disable-next-line react/static-property-placement
  protected props: TProps;

  protected sources: TSources;

  protected sinks: TSinks;

  protected convertSource: ConvertSource;

  protected updateSource: UpdateSource;

  // view
  protected latestView: React.ReactNode;

  protected onNewView: OnNewView;

  protected viewVersion: number;

  public viewIsUpToDate: boolean;

  protected compositeSubscription: CompositeSubscription;

  public constructor( env: IEnvironment,
                      options: IOptions<TNode, TSources, TSinks, TInitialData>,
                      onNewView: OnNewView ) {
    this.env = env;
    this.options = options;
    this.sourceNames = options.sourceNames;
    this.sinkNames = options.sinkNames;
    this.propIsEqual = options.propIsEqual || isEqual;

    this.convertSource = options.convertSource || stdConvertSource;
    this.updateSource = options.updateSource || stdUpdateSource;

    this.latestView = null;
    this.onNewView = onNewView;
    this.viewVersion = 0;
    this.viewIsUpToDate = false;

    this.props = null;
    this.sources = null;
    this.sinks = null;
  }

  public mount( firstProps: TProps ) {
    this.props = firstProps;
    this.compositeSubscription = new CompositeSubscription();

    // calling the component definition with proper sources and handling sinks
    this.sources = this.createSources( firstProps );
    const initialData = this.collectInitialData( firstProps );
    this.sinks = this.options.definition( this.sources, initialData ); // , this.lifecycles, this );
    this.handleSinks( this.sinks );

    // handle updated view
    const view$ = this.sinks.view || this.sinks.view$;
    const renderSubscription = view$.subscribe( newView => {
      this.latestView = newView;
      this.viewVersion++;

      // TODO: may trigger render before state was set resulting in two renders
      this.viewIsUpToDate = false;

      this.onNewView( this.latestView, this.viewVersion );
    } );

    this.compositeSubscription.add( renderSubscription );
  }

  public updateProps( newProps: TProps ) {
    // casting necessary, because TProps currently cannot extend Record
    const props = this.props as Record<string, any>;
    const cNewProps = newProps as Record<string, any>;
    const cSources = this.sources as any as Record<string, IObservable<any>>;

    // update sources if anything changed
    this.sourceNames.forEach( sourceName => {
      if ( sourceName in newProps && !this.propIsEqual( props[sourceName],
                                                        cNewProps[sourceName] ) ) {
        this.updateSource( sourceName, cSources[sourceName], cNewProps[sourceName] );
      }
    } );
    this.props = newProps;

    // update sinks if anything changed
    // TODO: handleSinks
  }

  /**
   * Inform this component that the view issued before was rendered.
   *
   * @param   viewVersion  Latest view that was rendered
   */
  public viewWasRendered( viewVersion: number ) {
    // the UI framework may not have updated to the newest version yet.
    // we adjust the view status only when we're there yet!
    this.viewIsUpToDate = viewVersion === this.viewVersion;
  }

  public unmount() {
    this.compositeSubscription.unsubscribe();
  }

  protected createSources( firstProps: TProps ): TSources {
    // casting necessary, because TProps currently cannot extend Record
    const fProps = firstProps as Record<string, any>;

    const sources: Record<string, IObservable<any>> = {};
    this.sourceNames.forEach( sourceName => {
      sources[sourceName] = this.convertSource( sourceName, fProps[sourceName] );
    } );

    // casting necessary, because TSources currently cannot extend Record
    return sources as any as TSources;
  }

  protected collectInitialData( firstProps: TProps ): TInitialData {
    if ( !this.options.initialDataNames ) return null;

    // casting necessary, because TProps currently cannot extend Record
    const fProps = firstProps as Record<string, any>;

    const data: Record<string, any> = {};
    this.options.initialDataNames.forEach( dataName => {
      data[dataName] = fProps[dataName];
    } );

    // casting necessary, because TInitialData currently cannot extend Record
    return data as TInitialData;
  }

  protected handleSinks( sinks: TSinks ) {
    // casting necessary, because TProps and TSinks currently cannot extend Record
    const props = this.props as Record<string, any>;
    const cSinks = sinks as Record<string, any>;

    // give sink to prop (Observer) of the same name
    // TODO: allow callback functions, too?
    const sinkNames = Object.keys( sinks );
    for ( let i = 0; i < sinkNames.length; ++i ) {
      const sinkName = sinkNames[i];
      const sinkObserver = props[sinkName];
      if ( sinkObserver && typeof sinkObserver.next === 'function' ) {
        sinkObserver.next( cSinks[sinkName] );
        sinkObserver.complete();
      }
    }
  }
}
