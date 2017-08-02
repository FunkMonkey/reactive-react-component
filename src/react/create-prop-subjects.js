import createSubject from '../utils/create-subject';

export default function ( Observable, inProps ) {
  const propSubjects = {};
  for ( const propName in inProps )
    propSubjects[propName] = createSubject( Observable );

  return propSubjects;
}
