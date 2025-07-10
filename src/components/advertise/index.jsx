import { useState, useEffect, useRef, useMemo } from 'react'
import { connect } from 'react-redux';
import { auth, db, storage, storageBucket } from "../../firebase"
import { doc,addDoc, setDoc, getDoc, collection , where, query, getDocs, startAfter , limit ,orderBy, serverTimestamp } from "firebase/firestore";
import {getDownloadURL,ref as storageRef,uploadBytes,uploadString} from "firebase/storage";
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {updateBaseStore } from "../../store/actions/baseActions"
import { updatePostStore } from "../../store/actions/postActions"
import { format } from 'date-fns';
import Button from '@mui/material/Button';
import ReactCountryFlagsSelect, { Us } from 'react-country-flags-select';
import { toast } from 'react-toastify';
import Slider from "react-slick";
import { getFireStoreUrl } from '../../utils/utils';

const AdvertiseComponent = (props) => {
  const [ads, setAds] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const settings = {
    dots: false,
    infinite: true,
    speed: 2000,
    slidesToShow: 1,
    slidesToScroll: 1,
    fade: true,
    autoplay: true,
    autoplaySpeed: 1000,
    afterChange: current => setActiveSlide(current)
  };
  
  useEffect(()=>{
    if(props.user.authenticated==true)
    {
      if(ads.length==0)
      {
        const q = query(collection(db, "ads"),where('banner','==',true),where('state','==','public'),where('state','==','public'),where('countryCode','==',props.user.countryCode));
        getDocs(q).then(async (snap)=>{
          let ads_=[];
          snap.forEach(doc=>{
            // let data=doc.data();
            ads_.push({id:doc.id,...doc.data()});
          })
          try {
            for(var i=0;i<ads_.length;i++)
            {
              let url=await getFireStoreUrl('ads/'+ads_[i].id)
              ads_[i].image=url
            }
            setAds([...ads_])
          } catch (error) {
            console.log(error);
          }
        })
      }
        // let currentUser=auth.currentUser;
        // if(currentUser==null) return;
        // let uid=currentUser.uid;
        
        // .catch((error) => {
        //   // Handle any errors
        // });
    }
  },[props.user.authenticated])
  return (<>
      <div className='w-full'>
         <Slider {...settings} className='h-[70px]'>
            {/* <img  src="/assets/ads/advertication/1.png"/> */}
            {ads.map(ad=><img crossOrigin="anonymous" src={ad.image}/>)}
          </Slider>
          <div><Button variant="contained" className='primary w-full' onClick={()=>{
            let ad=ads[activeSlide]
            if(!ad) return
            window.open(ad.productLink)
          }}>Go to Shop</Button></div>
      </div>
    </>)
}

const mapStateToProps = (state) => ({
    user: state.user
  });
  
export default connect(
    mapStateToProps,
    {   updateBaseStore, updatePostStore }
)(AdvertiseComponent);
  

