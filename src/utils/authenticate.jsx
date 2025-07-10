import { useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { auth } from '../firebase'
import { ToastContainer } from 'react-toastify'
import { GoogleOAuthProvider } from '@react-oauth/google'
import LoadingBackdrop from '../components/ui/loadingBackdrop';
import { Box } from '@mui/material'
import { getUserDataById, signOut } from '../store/actions/userActions'
import { getTags } from '../store/actions/baseActions'
import { getTopFollowersByPosts } from '../store/actions/colleagueAction'

const clientId = '981132907174-8dkvdgl9kfv794hchg46p9d2rkkdpa8n.apps.googleusercontent.com';
const signins = [
  '/post/create',
  '/chat',
  '/admin',
  '/advertise',
  '/profile',
  '/net',
  '/publish',
  '/payment',
]

const admins = ['/admin']

const Authenticate = (props) => {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const user = useSelector((state) => state.user)
  const base = useSelector((state) => state.base)
  const { loading, tags } = base

  useEffect(() => {
    if (!tags.length) {
      dispatch(getTags()).catch((err) => console.error('Error loading tags:', err));
    }
  
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      if (authUser) {
        if (authUser.emailVerified && !user.authenticated) {
          if (user.id === "") {
            dispatch(getUserDataById(authUser.uid))
              .then((res) => {
                if (res) {
                  dispatch(getTopFollowersByPosts());
                }
              })
              .catch((err) => {
                console.error('Error fetching user data:', err);
              });
          }
        }
      } else if (user.authenticated) {
        dispatch(signOut())
          .then(() => {
            // Handle success, if necessary
          })
          .catch((err) => {
            console.error('Error signing out:', err);
          });
      }
    });
  
    return () => unsubscribe();
  }, [user.authenticated]);
  

  if (!user.id && signins.some((path) => location.pathname.startsWith(path))) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          backgroundColor: '#ececec !important',
          textAlign: 'center',
          padding: 3,
        }}
      >
        <h2 style={{ color: '#333' }}>You need to sign in to access this page.</h2>
        <Link
          to="/"
          style={{
            marginTop: '16px',
            padding: '10px 20px',
            backgroundColor: '#0e2841',
            color: '#fff',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 'bold',
            transition: 'all 0.3s ease',
          }}
        >
          Go to Home
        </Link>
      </Box>
    )
  }

  if (!user.role?.admin && admins.some((path) => location.pathname.startsWith(path))) {
    navigate('/')
    return <>No Permission</>
  }

  return (
    <>
      <GoogleOAuthProvider clientId={clientId}>
        {props.children}
      </GoogleOAuthProvider>
      <LoadingBackdrop open={loading} />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        closeOnClick
        style={{ zIndex: 99999, position: 'fixed' }}
      />
    </>
  )
}

export default Authenticate
