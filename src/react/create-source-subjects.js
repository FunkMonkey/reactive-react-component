import createSubject from '../utils/create-subject';

export default function ( Observable, sources ) {
  const sourceSubjects = {};
  for ( const sourceName in sources )
    sourceSubjects[sourceName] = createSubject( Observable );

  return sourceSubjects;
}
