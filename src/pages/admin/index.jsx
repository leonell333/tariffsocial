
import { useState, useEffect, useRef, StrictMode } from 'react';
import { Outlet  } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { updateBaseStore } from '../../store/actions/baseActions';
import { updatePostStore } from '../../store/actions/postActions';
import LeftSide from './AdminLeftSide';

const MainLayout = () => {
  const dispatch = useDispatch()
  const keyword = useSelector(state => state.post.keyword)
  const unReadMessages = useSelector(state => state.base.unReadMessages)
  const user = useSelector(state => state.user)
  
  return (
    <div className="bg-[#ECECEC] w-full min-h-screen text-[#454545]">
      <div className="flex justify-center">
        <div className="w-full max-w-[1320px] relative">
          <div className="bg-white flex justify-center w-full">
            <div className="bg-white w-full relative px-4 flex">
              {/* Main Content Layout */}
              <div className="flex flex-col lg:flex-row gap-6 w-full mt-4">
                <div className="w-full lg:w-[200px]">
                  <LeftSide/>
                </div>
                <div className="flex-1 p-3">
                  <Outlet />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MainLayout;