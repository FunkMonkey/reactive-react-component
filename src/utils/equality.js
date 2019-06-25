/* eslint-disable no-restricted-syntax */
/* eslint-disable guard-for-in */

export const isEqual = ( a, b ) => a === b;

export const allPropsAreEqual = ( a, b, propIsEqual ) => {
  for ( const propName in a ) {
    if ( !( propName in b ) )
      return false;
    if ( !propIsEqual( a[propName], b[propName] ) )
      return false;
  }
  return true;
};
