import createBaseComponent from './react/create-base-component';
import createLifecycleSubjects from './react/create-lifecycle-subjects';
import createBridgeComponent from './react/create-bridge-component';
import createReactiveComponent from './react/create-reactive-component';

import CompositeSubscription from './utils/composite-subscription';
import createSourceSubjects from './utils/create-source-subjects';
import createSubject from './utils/create-subject';

const utils = {
  CompositeSubscription,
  createLifecycleSubjects,
  createSourceSubjects,
  createSubject
};

export {
  createBaseComponent,
  createBridgeComponent,
  createReactiveComponent,
  utils
};
