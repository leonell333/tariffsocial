import {Navigate, Route, Routes} from "react-router";
import React, {lazy, Suspense} from "react";
import {Provider} from 'react-redux'
import {LocalizationProvider} from '@mui/x-date-pickers/LocalizationProvider'
import {AdapterDayjs} from '@mui/x-date-pickers/AdapterDayjs'


import store from './store/store'


import Authenticate from './utils/authenticate'
import MainLayout from './pages/layout'
import NavBar from './components/layout/navbar'
import ScrollToTop from './components/home/scrollToTop'


// Pages
const Posts = lazy(() => import('./pages/post'))
const PostDetail = lazy(() => import('./pages/post/detail'))
const Profile = lazy(() => import('./pages/profile'))

// Network
const MyNet = lazy(() => import('./pages/net'))
const Colleagues = lazy(() => import('./pages/net/colleagues'))
const Following = lazy(() => import('./pages/net/following'))
const Followers = lazy(() => import('./pages/net/followers'))

// Info
const Contact = lazy(() => import('./pages/info/contact'))
const TariffInfo = lazy(() => import('./pages/info/tariffInfo'))
const AdvertiseRateCard = lazy(() => import('./components/advertise/advertiseRateCard'))

// Advertise
const Advertise = lazy(() => import('./pages/advertise'))
const CreateAds = lazy(() => import('./pages/advertise'))
const CreateBannerAd = lazy(() => import('./components/advertise/createBannerAd'))
const CreateSponsored = lazy(() => import('./components/advertise/createSponsored'))
const MyAdvertisements = lazy(() => import('./pages/advertise/myAds'))
const MySponsoredContents = lazy(() => import('./pages/advertise/mySponsored'))
const MyCampaigns = lazy(() => import('./pages/advertise/myCampaigns'))
const Payment = lazy(() => import('./pages/payment'))

// Admin
const Admin = lazy(() => import('./pages/admin'))
const AdminDashboard = lazy(() => import('./pages/admin/dashboard'))
const AdminPosts = lazy(() => import('./admin/post'))
const AdminAdvertise = lazy(() => import('./admin/advertise'))
const AdminSponsored = lazy(() => import('./admin/sponsored'))
const Products = lazy(() => import('./pages/products'))
const Dev = lazy(() => import('./pages/admin/dev'))

// Others
const Chat = lazy(() => import('./pages/chat'))
const Recommendations = lazy(() => import('./pages/net/recommendations'))
const Notification = lazy(() => import('./pages/chat/notification'))

function App() {
    return (
        <Provider store={store}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Authenticate>
                    <ScrollToTop/>
                    <NavBar/>
                    <div
                        className="main-content-scrollable custom-scrollbar mt-[72px] bg-[#ECECEC] overflow-hidden">
                        <Suspense fallback={<div>Loading...</div>}>
                            <Routes>
                                <Route path="/" element={<MainLayout/>}>
                                    <Route index element={<Posts/>}/>
                                    <Route path="post/:id" element={<PostDetail/>}/>
                                    <Route path="profile/:id" element={<Profile/>}/>
                                    <Route path="notifications" element={<Notification/>}/>
                                    <Route path="net" element={<MyNet/>}>
                                        <Route index element={<Navigate to="/net/colleagues" replace/>}/>
                                        <Route path="colleagues" element={<Colleagues/>}/>
                                        <Route path="following" element={<Following/>}/>
                                        <Route path="followers" element={<Followers/>}/>
                                    </Route>
                                    <Route path="recommendations" element={<Recommendations/>}/>
                                    <Route path="info/contact" element={<Contact/>}/>
                                    <Route path="info/about" element={<TariffInfo/>}/>
                                    <Route path="info/privacy" element={<TariffInfo/>}/>
                                    <Route path="info/terms" element={<TariffInfo/>}/>
                                    <Route path="info/copyright" element={<TariffInfo/>}/>
                                    <Route path="info/conduct" element={<TariffInfo/>}/>
                                    <Route path="info/advertise-rate" element={<AdvertiseRateCard/>}/>
                                </Route>

                                <Route path="/publish" element={<CreateAds/>}>
                                    <Route index element={<Navigate to="/publish/ads" replace/>}/>
                                    <Route path="ads" element={<CreateBannerAd/>}/>
                                    <Route path="sponsored" element={<CreateSponsored/>}/>
                                    <Route path="campaigns" element={<MyCampaigns/>}/>
                                    <Route path="payment" element={<Payment/>}/>
                                    {/* <-- Payment now uses CreateAdvertise layout */}
                                </Route>

                                <Route path="/advertise" element={<Advertise/>}>
                                    <Route
                                        index
                                        element={<Navigate to="/advertise/ads" replace/>}
                                    />
                                    <Route path="ads" element={<MyAdvertisements/>}/>
                                    <Route path="sponsored" element={<MySponsoredContents/>}/>
                                </Route>

                                {/* Removed: <Route path="/payment" element={<Payment />} /> */}
                                <Route path="/chat" element={<Chat/>}/>

                                <Route path="/admin" element={<Admin/>}>
                                    <Route
                                        index
                                        element={<Navigate to="/admin/dashboard" replace/>}
                                    />
                                    <Route path="dashboard" element={<AdminDashboard/>}/>
                                    <Route path="posts" element={<AdminPosts/>}/>
                                    <Route path="advertise" element={<AdminAdvertise/>}/>
                                    <Route path="sponsored" element={<AdminSponsored/>}/>
                                    <Route path="products" element={<Products/>}/>
                                    <Route path="dev" element={<Dev/>}/>
                                </Route>
                            </Routes>
                        </Suspense>
                    </div>
                </Authenticate>
            </LocalizationProvider>
        </Provider>
    )
}

export default App;