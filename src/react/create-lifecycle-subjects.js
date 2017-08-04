import createSubject from '../utils/create-subject';

export default function ( Observable ) {
  return {
    componentWillMount: createSubject( Observable ),
    componentDidMount: createSubject( Observable ),
    componentWillReceiveProps: createSubject( Observable ),
    componentWillUpdate: createSubject( Observable ),
    componentDidUpdate: createSubject( Observable ),
    componentWillUnmount: createSubject( Observable )
  };
}
