
import { useState, useEffect, useRef, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Users, UserPlus, Heart } from 'lucide-react'
import { resetAllNetData } from '../../store/actions/colleagueAction'

const MyNet = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);

  const handleNavigation = (path) => {
    dispatch(resetAllNetData());
    navigate(path);
  };

  return (
    <div className="w-full bg-white h-[calc(100vh-88px)] rounded-xl p-6 text-black space-y-6" style={{ fontFamily: 'poppins' }}>
      <div className="flex flex-row items-center justify-center space-x-8 text-[18px] border-b-2 border-b-gray-100 mb-2 pb-1">
        {
          location.pathname == '/net/colleagues' ? (
            <div
              className={`relative px-6 py-1 rounded-full font-semibold transition-all duration-300 ease-in-out transform hover:scale-105 cursor-pointer ${
                location.pathname == '/net/colleagues'
                  ? 'text-white bg-gradient-to-r from-blue-500 to-purple-600'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
              onClick={() => {
                handleNavigation('/net/colleagues')
              }}>
              <span className="flex items-center space-x-2">
                <Users className="w-6 h-6" />
                <span>{user.colleagueCount} Colleagues</span>
              </span>
            </div>
          ) : (
            <>
              <div
                className={`relative px-6 py-1 rounded-full font-semibold transition-all duration-300 ease-in-out transform hover:scale-105 cursor-pointer ${
                  location.pathname == '/net/following'
                    ? 'text-white bg-gradient-to-r from-green-500 to-teal-600 shadow-lg'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
                onClick={() => { handleNavigation('/net/following') }}>
                <span className="flex items-center space-x-2">
                  <UserPlus className="w-5 h-5" />
                  <span>{user.followCount} Following</span>
                </span>
              </div>
              <div
                className={`relative px-6 py-1 rounded-full font-semibold transition-all duration-300 ease-in-out transform hover:scale-105 cursor-pointer ${
                  location.pathname == '/net/followers'
                    ? 'text-white bg-gradient-to-r from-pink-500 to-red-600 shadow-lg'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
                onClick={() => { handleNavigation('/net/followers') }}>
                <span className="flex items-center space-x-2">
                  <Heart className="w-5 h-5" />
                  <span>{user.followerCount} Followers</span>
                </span>
              </div>
            </>
          )
        }
      </div>
      <div className="animate-fadeIn">
        <Outlet />
      </div>
    </div>
  )
}

export default MyNet;
