
import { useSelector, useDispatch } from 'react-redux'
import { useParams } from 'react-router-dom'
import ProfileView from './profileView'
import ProfileEdit from './profileEdit'

const Profile = () => {
  const { id } = useParams();
  const user = useSelector((state) => state.user);

  return <>{id != user.id ? <ProfileView id={id} /> : <ProfileEdit />}</>
}

export default Profile;