export type IsEqual = ( a: any, b: any ) => boolean;
export type AllEqual =
  ( a: Record<string, any>, b: Record<string, any>, propIsEqual: IsEqual ) => boolean;

export const isEqual: IsEqual = ( a: any, b: any ) => a === b;

export const allPropsAreEqual =
  ( a: Record<string, any>, b: Record<string, any>, propIsEqual: IsEqual ) =>
    Object.entries( a ).every(
      ( [propName, value] ) => ( propName in b ) && propIsEqual( value, b[propName] )
    );
