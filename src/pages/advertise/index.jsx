import { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux';
import "../../pages/advertise/advertise.css"
import LeftSide from '../layout/leftSide';
import { Outlet, useLocation, useNavigate } from 'react-router';

const LEFT_SIDE_WIDTH = 250;
const SIDE_MARGIN = 70;
const SCALE = 0.92;
const CONSTANT_GAP = 0;

const CreateAdvertise = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const layoutRef = useRef(null);
  const [layoutLeft, setLayoutLeft] = useState(0);
  const [layoutWidth, setLayoutWidth] = useState(1320);
  const user = useSelector(state => state.user);
  
  useEffect(() => {
    const updateLayout = () => {
      if (layoutRef.current) {
        const rect = layoutRef.current.getBoundingClientRect();
        setLayoutLeft(rect.left);
        setLayoutWidth(rect.width);
      }
    };
    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, []);

  const leftScaleOffset = (LEFT_SIDE_WIDTH * (1 - SCALE)) / 2;
  const leftSideLeft = layoutLeft + SIDE_MARGIN;
  const middleSectionLeft = leftSideLeft + LEFT_SIDE_WIDTH + CONSTANT_GAP - leftScaleOffset;
  const middleSectionWidth = layoutWidth >= 1024
    ? layoutWidth - (middleSectionLeft - layoutLeft) - SIDE_MARGIN
    : layoutWidth;

  return (
    <div className="bg-[#ECECEC] w-full min-h-[calc(100vh-72px)] text-[#454545]">
      <div className="flex justify-center">
        <div className="relative max-w-[1320px] w-full" ref={layoutRef}>
          <div
            className="hidden lg:block fixed top-[86px] z-10"
            style={{
              width: `${LEFT_SIDE_WIDTH}px`,
              left: `${leftSideLeft}px`,
            }}
            id="left-side"
          >
            <div className="transform scale-[0.92] origin-top h-full w-full">
              <LeftSide />
            </div>
          </div>

          <div
            id="middle-section"
            className="w-full min-h-[calc(100vh-108px)] mt-4 flex flex-col justify-center transition-all duration-300 overflow-x-hidden px-2 sm:px-4 lg:px-6"
            style={
              layoutWidth >= 1024
                ? {
                    marginLeft: `${middleSectionLeft - layoutLeft}px`,
                    marginRight: `${SIDE_MARGIN}px`,
                    width: `${middleSectionWidth}px`,
                  }
                : { marginLeft: 0, marginRight: 0, width: '100%' }
            }
          >
            <div className='mx-5 pb-[30px] flex flex-row text-[20px] border-none'>
              <div className={`rounded-lg px-6 ${location.pathname=='/publish/ads'?' bg-[#0e2841] border-none text-white':'text-[#161722] border border-[[#0e2841]] cursor-pointer'}`} onClick={()=>{
                  navigate('/publish/ads')
                }}> Banner Advertisements</div>
              <div className={`ml-5 rounded-lg px-6  ${location.pathname=='/publish/sponsored'?'bg-[#0e2841] border-none text-white':'text-[#161722] border border-[[#0e2841]] cursor-pointer'}`} onClick={()=>{
                  navigate('/publish/sponsored')
              }}> Sponsored Content</div>
              <div className={`ml-5 rounded-lg px-6  ${location.pathname=='/publish/campaigns'?'bg-[#0e2841] border-none text-white':'text-[#161722] border border-[[#0e2841]] cursor-pointer'}`} onClick={()=>{
                  navigate('/publish/campaigns')
              }}> Campaigns</div>
            </div>

            <div className=" flex-grow min-w-0 w-full flex flex-col">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateAdvertise;