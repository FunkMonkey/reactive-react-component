// eslint-disable-next-line import/no-extraneous-dependencies
import React from 'react';
import { IEnvironment } from '../InternalComponent';

export default interface IReactEnvironment extends IEnvironment {
  React: typeof React;
}
