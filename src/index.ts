// import createLifecycleSubjects from './react/create-lifecycle-subjects';
// import createBridgeComponent from './react/create-bridge-component';
import CompositeSubscription from './utils/composite-subscription';

export { default as createReactiveComponent, IReactOptions, IReactSinks } from './react/create-reactive-component';
export { default as IReactEnvironment } from './react/IReactEnvironment';
export { ISinks } from './InternalComponent';
// import createSourceSubjects from './utils/create-source-subjects';
// import createSubject from './utils/create-subject';

const utils = {
  CompositeSubscription,
  // createLifecycleSubjects,
  // createSourceSubjects,
  // createSubject
};

export {
  // createBaseComponent,
  // createBridgeComponent,
  utils
};
