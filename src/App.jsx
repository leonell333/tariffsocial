
import './App.css'
import store from './store/store'
import { Provider } from 'react-redux'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import Posts from './pages/post'
import PostDetail from './pages/post/detail'
import Chat from './pages/chat'
import Notification from './pages/chat/notification'
import NavBar from './components/layout/navbar'
import Authenticatie from './utils/authenticate'
import Advertise from './pages/advertise'
import CreateAds from './pages/advertise'
import CreateBannerAd from './components/advertise/createBannerAd'
import CreateSponsored from './components/advertise/createSponsored'
import AdvertiseRateCard from './components/advertise/advertiseRateCard'
import Profile from './pages/profile'
import MainLayout from './pages/layout'
import Admin from './pages/admin'
import AdminDashboard from './pages/admin/dashboard'
import Contact from './pages/info/contact'
import AdminPosts from './admin/post'
import AdminAdvertise from './admin/advertise'
import AdminSponsored from './admin/sponsored'
import Products from './pages/products'
import MyNet from './pages/net'
import Colleagues from './pages/net/colleagues'
import Following from './pages/net/following'
import Followers from './pages/net/followers'
import Recommendations from './pages/net/recommendations'
import MyAdvertisements from './pages/advertise/myAds'
import MySponsoredContents from './pages/advertise/mySponsored'
import MyCampaigns from './pages/advertise/myCampaigns'
import Payment from './pages/payment'
import Dev from './pages/admin/dev'
import TariffInfo from './pages/info/tariffInfo'
import ScrollToTop from './components/home/scrollToTop'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'

function App() {
  return (
    <>
      <Provider store={store}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <BrowserRouter future={{
              v7_relativeSplatPath: true,
              v7_startTransition: true,
            }}>
            <Authenticatie>
              <ScrollToTop />
              <NavBar />
              <div className="main-content-scrollable custom-scrollbar mt-[72px] bg-[#ECECEC] overflow-hidden">
                <Routes>
                  <Route path="/" element={<MainLayout />}>
                    <Route index element={<Posts />} />
                    <Route path="post/:id" element={<PostDetail />} />
                    <Route path="profile/:id" element={<Profile />} />
                    <Route path="notifications" element={<Notification />} />
                    <Route path="net" element={<MyNet />}>
                      <Route index element={<Navigate to="/net/colleagues" replace />}/>
                      <Route path="colleagues" element={<Colleagues />} />
                      <Route path="following" element={<Following />} />
                      <Route path="followers" element={<Followers />} />
                    </Route>
                    <Route path="recommendations" element={<Recommendations />} />
                    <Route path="info/contact" element={<Contact />} />
                    <Route path="info/about" element={<TariffInfo />} />
                    <Route path="info/privacy" element={<TariffInfo />} />
                    <Route path="info/terms" element={<TariffInfo />} />
                    <Route path="info/copyright" element={<TariffInfo />} />
                    <Route path="info/conduct" element={<TariffInfo />} />
                    <Route path="info/advertise-rate" element={<AdvertiseRateCard />} />
                  </Route>

                  <Route path="publish" element={<CreateAds />}>
                    <Route index element={<Navigate to="/publish/ads" replace />} />
                    <Route path="ads" element={<CreateBannerAd />} />
                    <Route path="sponsored" element={<CreateSponsored />} />
                    <Route path="campaigns" element={<MyCampaigns />} />
                    <Route path="payment" element={<Payment />} /> {/* <-- Payment now uses CreateAdvertise layout */}
                  </Route>

                  <Route path="advertise" element={<Advertise />}>
                    <Route
                      index
                      element={<Navigate to="/advertise/ads" replace />}
                    />
                    <Route path="ads" element={<MyAdvertisements />} />
                    <Route path="sponsored" element={<MySponsoredContents />} />
                  </Route>

                  {/* Removed: <Route path="/payment" element={<Payment />} /> */}
                  <Route path="/chat" element={<Chat />} />

                  <Route path="/admin" element={<Admin />}>
                    <Route
                      index
                      element={<Navigate to="/admin/dashboard" replace />}
                    />
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="posts" element={<AdminPosts />} />
                    <Route path="advertise" element={<AdminAdvertise />} />
                    <Route path="sponsored" element={<AdminSponsored />} />
                    <Route path="products" element={<Products />} />
                    <Route path="dev" element={<Dev />} />
                  </Route>
                </Routes>
              </div>
            </Authenticatie>
          </BrowserRouter>
        </LocalizationProvider>
      </Provider>
    </>
  )
}

export default App;