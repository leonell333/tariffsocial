import React, {useEffect, useRef, useState} from 'react'
import {useDispatch, useSelector} from 'react-redux'
import Button from '@mui/material/Button'
import {ChevronRight} from 'lucide-react'
import Slider from 'react-slick';

// const Slider = React.lazy(() => import('react-slick'))

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
                    <img
                        loading={index == 0 ? 'eager' : 'lazy' }
                        crossOrigin="anonymous"
                        src={ad.imageUrl}
                        className="w-full min-h-[260px] block"
                        alt={"Ads " +index}
                        fetchPriority={index == 0 ? "high" : "auto" }
                    />
                  </div>
                ))}
              </Slider>
        )}
      </div>
      <div className="w-full">
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
