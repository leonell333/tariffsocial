
import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar'
import userAvatar from '../../assets/images/user.png'
import { Card, } from '../../components/ui/card'
import { MyNetIcon, NotificationIcon, DmIcon } from '../ui/icons'
import { UserPlus, LogOut } from 'lucide-react'
import { signOut } from '../../store/actions/userActions'
import { GoogleAuthProvider, } from 'firebase/auth'
export const provider = new GoogleAuthProvider()

const UserInfo = (props) => {
  const navigate = useNavigate()
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const colleague = useSelector((state) => state.colleague);
  const base = useSelector((state) => state.base);

  const handleSignOut = () => {
    dispatch(signOut()).then((res) => {
      if (res) {
        navigate("/")
      }
    }).catch((err) => {
      console.log('Failed to fetch colleague count:', err);
    });
  }

  return (
    <Card className="shadow-none border border-solid bg-[#fff] border-[#EBEBEB] rounded-xl overflow-hidden cursor-pointer pb-1.5">
      <div
        className="h-[71px] bg-[#EBEBEB] rounded-t-md"
        onClick={() => {
          navigate('/profile/' + user.id)
        }}>
        <img
          className="w-full h-[71px] object-cover"
          src="/assets/images/profile/back.png"
          alt="Cover"
        />
      </div>
      <div
        className="flex flex-col items-center px-4 pb-4 pt-2 relative bg-white"
        onClick={() => {
          navigate('/profile/' + user.id)
        }}>
        <div className='relative'>
          <Avatar className="w-[70px] h-[70px] -mt-12 border-2 border-white">
            <AvatarImage
              src={user.photoUrl ? user.photoUrl : userAvatar}
              alt="Profile"
              className="object-cover w-full h-full"
            />
            <AvatarFallback></AvatarFallback>
          </Avatar>
          {['online', 'offline'].includes(user.status) && (
            <span
              className={`absolute bottom-2 right-1 w-3 h-3 rounded-full border border-white ${
                user.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
              }`}
            ></span>
          )}
        </div>

        <div className="text-center mt-2">
          <div className="flex items-center justify-center gap-1">
            <h2 className="text-black text-base" style={{ fontFamily: 'poppins' }}>
              {user.username}
            </h2>
            {user.isVerified && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0ea5e9"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="feather feather-check-circle">
                <path d="M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            )}
          </div>

          <p className="text-[#666666] text-sm h-[18.5px]">{user.information}</p>
        </div>
      </div>

      <div className="flex flex-col w-full my-1">
        <div
          className="flex items-center hover:bg-gray-100 px-12 py-1 rounded-md cursor-pointer"
          onClick={() => navigate('/notifications')}
        >
          <div className="min-w-[28px] flex justify-center items-center relative">
            <div className="pl-[2px] w-6 h-[26.4px] mt-1">
              <NotificationIcon />
            </div>
            {base.unReadNotificationCount > 0 && (
              <div className="absolute top-[4px] right-[8px] w-4 h-4 text-xs bg-red-600 text-white rounded-full flex items-center justify-center translate-x-1/2 -translate-y-1/2">
                {base.unReadNotificationCount}
              </div>
            )}
          </div>

          <span className="ml-4 text-[#454545] text-base font-medium leading-none">
            Notification
          </span>
        </div>

        <div
          className="flex items-center hover:bg-gray-100 px-12 py-1 rounded-md cursor-pointer relative"
          onClick={() => {
            navigate('/chat')
          }}>
          <div className="min-w-[28px] flex justify-center items-center">
            <div className="relative w-6 h-[26.4px] mt-1">
              <DmIcon />
            </div>
          </div>
          <span className="ml-4 text-[#454545] text-base font-medium leading-none">
            DM
          </span>
          {base.unReadMessagesCount > 0 && (
            <div className="absolute -top-0 left-16 w-4 h-4 text-xs bg-red-600 text-white rounded-full flex items-center justify-center">
              {base.unReadMessagesCount}
            </div>
          )}
        </div>

        <div
          className="flex items-center hover:bg-gray-100 px-12 py-1 rounded-md cursor-pointer relative"
          onClick={() => {
            navigate('/net')
          }}>
          <div className="min-w-[28px] flex justify-center items-center">
            <div className="relative w-6 h-[26.4px] text-[#454545]">
              <MyNetIcon />
            </div>
          </div>
          <span className="ml-4 text-[#454545] text-base font-medium leading-none">
            {user.colleagueCount} Affiliations
          </span>
        </div>
      </div>

      <div className="flex items-center hover:bg-gray-100 px-12 py-1 rounded-md cursor-pointer relative"
        onClick={() => navigate('/net/followers')}
      >
        <div className="min-w-[28px] flex justify-center items-center">
          <div className="relative w-6 h-[26.4px] flex items-center">
            <div className="flex -space-x-3">
              {user.followerCount === 0 ? (
                <UserPlus size={24} strokeWidth={2.25} className="text-gray-700" />
              ) : (
                <>
                  {colleague.topFollowers.map((follower, index) => (
                    <Avatar key={index} className="w-6 h-6 border border-white">
                      <AvatarImage
                        src={follower.photoUrl}
                        className="w-full h-full object-cover rounded-full"
                      />
                    </Avatar>
                  ))}
                  {user.followerCount > 3 && (
                    <div className="w-5 h-5 bg-gray-300 text-[10px] font-semibold text-white flex items-center justify-center rounded-full border border-white">
                      +{user.followerCount - 3}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        <span className="ml-4 text-[#454545] text-base font-medium leading-none">
          {user.followerCount} Followers
        </span>
      </div>

      {user.authenticated && (
        <div
          className="flex items-center hover:bg-gray-100 px-12 py-1 rounded-md cursor-pointer relative"
          onClick={() => {
            navigate('/publish/ads')
          }}>
          <div className="min-w-[28px] flex justify-center items-center">
            <div className="relative w-6 h-[26.4px] mt-1">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M16.5 5.5H7.5V6.5H16.5V5.5Z"
                  fill="#464646"
                  stroke="#464646"
                />
                <path
                  d="M16.5 9.5H7.5V10.5H16.5V9.5Z"
                  fill="#464646"
                  stroke="#464646"
                />
                <path d="M16.5 13H7.5V14H16.5V13Z" fill="#464646" stroke="#464646" />
                <path d="M11.5 17H7.5V18H11.5V17Z" fill="#464646" stroke="#464646" />
                <path
                  d="M3 22H7.094H12H16.906H21V2H3V22ZM4 3H20V21H18.5H16.906H15H12H10.5H9H7.094H4V3Z"
                  fill="#464646"
                  stroke="#464646"
                />
              </svg>
            </div>
          </div>
          <span className="ml-4 text-[#454545] text-base font-medium leading-none">
            Advertising
          </span>
        </div>
      )}
      
      {user.authenticated && (
        <div
          className="flex items-center hover:bg-gray-100 px-12 py-1 rounded-md cursor-pointer relative mb-2"
          onClick={(handleSignOut)}>
          <div className="min-w-[28px] flex justify-center items-center">
            <div className="relative w-6 h-[26.4px] mt-1">
              <LogOut size={24} strokeWidth={2.25} className="text-[#454545]"/>
            </div>
          </div>
          <span className="ml-4 text-[#454545] text-base font-medium leading-none">
            Sign out
          </span>
        </div>
      )}
    </Card>
  )
}

export default UserInfo;
