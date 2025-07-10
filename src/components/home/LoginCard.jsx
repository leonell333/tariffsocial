
import { useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { FcGoogle } from 'react-icons/fc'
import { FaApple } from 'react-icons/fa'
import { Eye, EyeOff } from 'lucide-react'
import { googleLogin, signIn, signUp } from '../../store/actions/userActions'

const LoginCard = (props) => {
  const navigate = useNavigate()
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [activeTab, setActiveTab] = useState('login')
  const [showPassword, setShowPassword] = useState(false)
  const [updateData, setUpdateData] = useState({
    email: '',
    userName: '',
    password: '',
  })

  const handleSignin = async () => {
    if (!email.trim() || !password.trim()) {
      toast.warn('Please enter both email and password.', { position: 'top-right' });
      return;
    }
    dispatch(signIn(email, password)).then((res) => {
      if (res) {
        navigate('/');
      }
      }).catch((error) => {
        console.error('Signin failed:', error);
        toast.error(`Error: ${error}`, { position: 'top-right' });
      });
  };

  const handleSignUp = async () => {
    const { email, password, userName } = updateData
    if (!email.trim() || !password.trim() || !userName.trim()) {
      toast.warn('Please fill out all fields.', { position: 'top-right' })
      return
    }
    if (password.length < 6) {
      toast.error('Password should be at least 6 characters.', { position: 'top-right' })
      return
    }
    dispatch(signUp(email, password, userName))
      .then((res) => {
        setActiveTab('login');
        navigate('/');
      })
      .catch((err) => {
        console.error('Signup failed:', err);
        toast.error(`Error: ${err}`, { position: 'top-right' });
      });
    
  }

  const handleGoogleLogin = async () => {
    dispatch(googleLogin()).then((res) => {
      if (res) {
        navigate('/');
      }
    }).catch((err) => {
      console.error('Login failed:', err);
      toast.error('Login failed. Please try again.', { position: 'top-right' });
    });
  }

  // const handleGoogleLoginSuccess = async (response) => {
  //   try {
  //     const credential = GoogleAuthProvider.credential(response.credential)
  //     const result = await signInWithCredential(credential)
  //     updateSignedUser({
  //       uid: result.user.uid,
  //       email: result.user.email,
  //       username: result.user.displayName,
  //       updateUserStore: dispatch(updateUserStore),
  //     })
  //     navigate('/')
  //   } catch (error) {
  //     console.error('Error during Google Sign-In:', error.message)
  //   }
  // }

  return (
    <div className="border border-gray-300 rounded-xl p-6 max-w-sm w-full mx-auto bg-white text-[#454545]">
      <div className="flex justify-between items-center mb-4 cursor-pointer">
        <span
          onClick={() => setActiveTab('login')}
          className={`font-semibold text-[17px] px-2.5 py-0.5 rounded-md transition 
            ${activeTab === 'login'
                ? 'text-gray-500 border border-gray-300'
                : 'text-gray-500 hover:bg-gray-100'
            }`}>
          Log in
        </span>

        <span
          onClick={() => setActiveTab('signup')}
          className={`font-semibold text-[17px] px-2.5 py-0.5 rounded-md transition cursor-pointer
            ${activeTab === 'signup'
                ? 'text-gray-500 border border-gray-300 bg-gray-100'
                : 'text-gray-300 hover:bg-gray-100'
            }`}>
          Sign up
        </span>
      </div>

      <button
        className="flex items-center justify-center gap-2 w-full py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 cursor-pointer"
        onClick={handleGoogleLogin}>
        <FcGoogle className="text-xl" />
        Continue with Google
      </button>

      <button className="flex items-center justify-center gap-2 w-full py-2 mt-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 cursor-pointer">
        <FaApple className="text-xl" />
        Sign in with Apple
      </button>

      <div className="flex items-center gap-2 my-4 justify-center">
        <hr className="w-[90px] border-gray-300" />
        <span className="text-sm text-gray-500">or</span>
        <hr className="w-[90px] border-gray-300" />
      </div>
      {activeTab == 'login' ? (
        <div>
          <input
            type="email"
            placeholder="email"
            className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3 text-sm focus:outline-none"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
            }}
          />

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm pr-10 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSignin()
                }
              }}
            />
            <div
              className="absolute right-3 top-2.5 text-gray-500 cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </div>
          </div>
        </div>
      ) : (
        <div>
          <input
            type="text"
            placeholder="name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3 text-sm focus:outline-none"
            value={updateData.userName}
            onChange={(e) =>
              setUpdateData({ ...updateData, userName: e.target.value })
            }
          />

          <input
            type="email"
            placeholder="email"
            className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3 text-sm focus:outline-none"
            value={updateData.email}
            onChange={(e) =>
              setUpdateData({ ...updateData, email: e.target.value })
            }
          />

          <div className="relative mb-3">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm pr-10 focus:outline-none"
              value={updateData.password}
              onChange={(e) =>
                setUpdateData({ ...updateData, password: e.target.value })
              }
            />
            <div
              className="absolute right-3 top-2.5 text-gray-500 cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </div>
          </div>
        </div>
      )}

      <button
        className="w-full mt-4 border border-gray-300 text-white py-2 rounded-md font-medium hover:opacity-90 bg-[#1E202F] text-[22px] cursor-pointer"
        onClick={() =>
          activeTab == 'login' ? handleSignin() : handleSignUp()
        }>
        {activeTab == 'login' ? 'Log in' : 'Sign up'}
      </button>

      <div className="flex gap-6 mt-1">
        <a href="#" className="text-blue-500 font-medium text-[19px]">
          Forgot password?
        </a>
      </div>

      {!user.authenticated && (
        <div
          className="ml-0 mt-4 text-[17px] text-center lg:text-left"
          onClick={() => navigate('/')}>
          Not on Tariff Social?
          <a href="#" className="text-blue-500 font-medium ml-2">
            Sign
          </a>
        </div>
      )}
    </div>
  )
}

export default LoginCard;