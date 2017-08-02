import createSubject from '../utils/create-subject';

export default function ( Observable ) {
  this.componentWillMount = createSubject( Observable );
  this.componentDidMount = createSubject( Observable );
  this.componentWillReceiveProps = createSubject( Observable );
  this.componentWillUpdate = createSubject( Observable );
  this.componentDidUpdate = createSubject( Observable );
  this.componentWillUnmount = createSubject( Observable );
}
