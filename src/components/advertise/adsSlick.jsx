import { useState, useEffect, useRef, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { updateBaseStore } from '../../store/actions/baseActions'
import { updatePostStore } from '../../store/actions/postActions'
import Button from '@mui/material/Button'
import Slider from 'react-slick'
import { ChevronRight } from 'lucide-react'

const AdsSlick = (props) => {
  const dispatch = useDispatch()
  const user = useSelector(state => state.user)
  
  const { ads } = props
  const containerRef = useRef(null)
  const [width, setWidth] = useState(null);
  const [activeSlide, setActiveSlide] = useState(0)

  const settings = {
    dots: true,
    infinite: true,
    speed: 2000,
    slidesToShow: 1,
    slidesToScroll: 1,
    fade: true,
    autoplay: false,
    autoplaySpeed: 10000,
    afterChange: (current) => setActiveSlide(current),
    beforeChange: (current, next) => setActiveSlide(next),
    variableWidth: false,
  };

  // const settings = {
  //   dots: true,
  //   infinite: true,
  //   speed: 500,
  //   slidesToShow: 1,
  //   slidesToScroll: 1,
  //   fade: true,
  //   autoplay: false,
  //   afterChange: (current) => setActiveSlide(current),
  //   beforeChange: (current, next) => setActiveSlide(next),
  //   variableWidth: false,
  // };

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setWidth(containerRef.current.offsetWidth);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className='bg-white border border-[#EBEBEB] p-[10px] rounded-xl'>
      <div ref={containerRef} className="overflow-hidden w-full advertise-slider">
        {width && (
          <Slider {...settings} style={{ width: width, }} >
            {ads.map((ad, index) => (
              <div key={index} style={{ width: width }}  className="h-full">
                <img crossOrigin="anonymous" src={ad.imageUrl}  className="w-full min-h-[260px] block" />
              </div>
            ))}
          </Slider>
        )}
      </div>
      <div className="w-full">
        {/* <button
            type="button"
            className="bg-[#0e2841] text-white px-4 hover:bg-[#1c3b63] cursor-pointer  w-full h-[35px] font-[19px] rounded-[50px]" onClick={()=>{
              let ad=ads[activeSlide]
            if(!ad) return
            window.open(ad.productLink)
            }}
          >
            Go to Shop
          </button> */}
        <Button
          variant="contained"
          className="p-0 w-full bg-blue-600 text-white text-sm font-medium !rounded-[18px] hover:bg-blue-700 transition"
          onClick={() => {
            let ad = ads[activeSlide]
            if (!ad) return
            window.open(ad.productLink)
          }}>
          <div className="w-full flex items-center justify-between">
            <span className="normal-case pl-4 text-[16px]">Go to shop</span>
            <ChevronRight size={25} />
          </div>
        </Button>
      </div>
    </div>
  )
}

export default AdsSlick;
