import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { collection, query, where, orderBy, onSnapshot, Timestamp, getDocs, writeBatch, doc, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import logo from '../../assets/images/logo.webp'
import { SearchIcon, Bell, MessageCircle } from 'lucide-react'
import { Radio, RadioGroup, FormControlLabel, FormControl, Modal, Button, Box, Badge } from '@mui/material'
import { Input } from '../../components/ui/input'
import { extractKeywords } from '../../utils'
import CreateAdvertisement from '../../pages/advertise'
import { updatePostStore, searchPostsByKeywords } from '../../store/actions/postActions'
import { updateBaseStore, getUnreadCounts } from '../../store/actions/baseActions'

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const post = useSelector((state) => state.post);
  const base = useSelector((state) => state.base);
  const { bannerAdsModal, sponsoredModal, unReadMessages } = base;
  const [adsType, setAdsType] = useState('banner');
  const [adsSelectModalShow, setAdsSelectModalShow] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [inputTimeout, setInputTimeout] = useState(null);

  // Real-time message listener
  useEffect(() => {
    if (!user?.authenticated || !user?.id) return;
    const listenerStartTime = Timestamp.now();
    const messagesQuery = query(
      collection(db, 'messages'),
      where('to', '==', user.id),
      where('read', '==', 0),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const messageTimestamp = data.timestamp;
          if (messageTimestamp?.toMillis() > listenerStartTime.toMillis()) {
            dispatch(getUnreadCounts());
          }
        }
      });
    }, (error) => {
      console.error('Error listening for messages:', error);
    });
    dispatch(getUnreadCounts());
    return () => {
      unsubscribe();
    };
  }, [user?.authenticated, user?.id, dispatch]);

  const AdsModal = () => (
    <Modal
      open={adsSelectModalShow}
      className="block-modal"
      onClose={() => setAdsSelectModalShow(false)}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description">
      <div
        className="w-[425px] h-60 bg-white absolute top-[50vh - 120px ]"
        style={{ top: 'calc(50vh - 120px)', left: 'calc(50vw - 212px)' }}>
        <div className="flex flex-col items-center py-7 px-6">
          <h3 className=" font-[SF_Pro_Text] text-black text-[20px] mb-3">
            Choose Advertisement Type.
          </h3>
          <FormControl>
            <RadioGroup
              aria-labelledby="demo-radio-buttons-group-label"
              value={adsType}
              name="radio-buttons-group"
              onChange={() => setAdsType(event.target.value)}>
              <FormControlLabel
                value="banner"
                control={<Radio />}
                label="Banner Advertisement"
              />
              <FormControlLabel
                value="sponsored"
                control={<Radio />}
                label="Sponsored Post"
              />
            </RadioGroup>
          </FormControl>

          <div className="flex justify-center gap-16 w-full mt-2">
            <Button
              variant="ghost"
              className="text-[#454545] font-text-1-web text-[16px] font-normal"
              onClick={() => {
                setAdsSelectModalShow(false)
                if (adsType === 'banner')
                  dispatch(updateBaseStore({ bannerAdsModal: true }))
                if (adsType === 'sponsored')
                  dispatch(updateBaseStore({ sponsoredModal: true }))
              }}>
              Ok
            </Button>

            <Button
              variant="ghost"
              className="text-black font-tex-1-medium-web text-[16px] font-medium"
              onClick={() => {
                setAdsSelectModalShow(false)
              }}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )

  useEffect(() => {
    if (inputTimeout) {
      clearTimeout(inputTimeout)
    }
    const timeout = setTimeout(() => {
      const keywordArray = extractKeywords(keyword)
      if (keywordArray.length > 0) {
        dispatch(searchPostsByKeywords(keywordArray, true))
      } else {
        dispatch(updatePostStore({ 
          keyword: [],
          isSearchMode: false,
          searchPosts: [],
          lastSearchPost: null,
          lastSearchPostVisible: false
        }))
      }
    }, 1000)
    setInputTimeout(timeout)
    return () => {
      clearTimeout(timeout)
    }
  }, [keyword])

  const handleSearch = (e) => {
    setKeyword(e.target.value.trim())
    if (e.keyCode === 13) {
      const keywordArray = extractKeywords(e.target.value)
      if (keywordArray.length > 0) {
        dispatch(searchPostsByKeywords(keywordArray, true))
      } else {
        dispatch(updatePostStore({ 
          keyword: [],
          isSearchMode: false,
          searchPosts: [],
          lastSearchPost: null,
          lastSearchPostVisible: false
        }))
      }
    }
  }

  const handleClearSearch = () => {
    setKeyword("")
    dispatch(updatePostStore({ 
      keyword: [],
      isSearchMode: false,
      searchPosts: [],
      lastSearchPost: null,
      lastSearchPostVisible: false
    }))
  }

  return (
    <>
      <div className="fixed top-0 inset-x-0 z-50 bg-[#0e2841]">
        <div className="w-full max-w-[1320px] mx-auto px-[60px] header-bar">
          <header className="w-full h-14 flex items-center justify-between relative mt-2 mb-2 lg:h-14">
            <div
              className="flex items-center gap-2 w-max cursor-pointer header-logo-menu"
              onClick={() => navigate('/')}
            >
              <img
                className="h-[48px] object-contain select-none cursor-pointer"
                alt="TariffSocial Logo point"
                src={logo}
                style={{
                  imageRendering: 'auto',
                  shapeRendering: 'geometricPrecision',
                  textRendering: 'geometricPrecision',
                  transform: 'translateZ(0)'
                }}
              />
              <div
                className="text-white ml-1 tracking-[1px] text-[25px]"
                style={{ fontFamily: 'poppins', fontWeight: 700 }}
              >
                Tariff Social
              </div>
            </div>

            <div className="w-full lg:w-10 lg:flex-auto flex justify-center mt-2 lg:mt-0 header-search">
              <style>
                {`
                  .custom-input::placeholder {
                    font-family: 'poppins', cursive;
                  }
                `}
              </style>
              {location.pathname === '/' && (
                <div className="w-[85%] border rounded-[120px] border-[#acacac] h-[44px]">
                  <div className="flex items-center gap-2 justify-between px-4 h-full">
                    <SearchIcon className="w-5 h-5 text-[#aeaeb2]" />
                    <Input
                      type="text"
                      value={keyword}
                      onChange={handleSearch}
                      placeholder="Search"
                      onKeyUp={(e) => {
                        if (e.keyCode === 13)
                          dispatch(updatePostStore({ keyword }))
                      }}
                      className="text-white border-none shadow-none pl-1 text-base font-sans focus:outline-none bg-transparent w-full focus:ring-0 placeholder-white placeholder:text-[18px] placeholder:font-poppins focus-visible:ring-0 custom-input"
                    />
                    {post.isSearchMode && (
                      <button
                        onClick={handleClearSearch}
                        className="text-white hover:text-gray-300 text-sm px-2 py-1 rounded"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* right menu */}
            <div className="flex items-center w-max flex-none lg:w-[300px] advertise-on-menu gap-4">
              <div
                className="rounded-[22px] cursor-pointer ml-4 w-80 lg:w-[80%] flex items-center justify-center gap-2 py-1 px-3 advertise-on-button"
                style={{ backgroundColor: 'rgba(14, 40, 65, 0.7)' }}
                onClick={() => {
                  navigate(user.authenticated ? '/publish' : 'info/advertise-rate')
                }}
              >
                <div
                  className="text-white text-[20px] ml-3 mr-2"
                  style={{ fontFamily: 'poppins', fontWeight: 600 }}
                >
                  Advertise On
                </div>
                <Box>
                  <img src={logo} className="h-[40px] mt-[6px]" style={{ imageRendering: 'optimizeQuality', transform: 'translateZ(0)' }} />
                </Box>
              </div>
            </div>
          </header>
        </div>
        <AdsModal />

        {bannerAdsModal && <CreateAdvertisement />}
      </div>
    </>
  )
}

export default Navbar;