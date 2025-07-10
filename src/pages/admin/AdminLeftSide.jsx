import { useState, useEffect, useRef, StrictMode } from 'react';
import { connect } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { GrUserAdmin } from "react-icons/gr";
import { SearchIcon, CopyrightIcon, FileIcon, FileTextIcon, HomeIcon, InfoIcon, InstagramIcon, LinkedinIcon, LockIcon, MailIcon, MessageSquareIcon, ShoppingCartIcon,
   YoutubeIcon, ClipboardListIcon, XIcon,FacebookIcon , BellIcon, Instagram, Youtube, Linkedin } from 'lucide-react';
import LoginCard from '../../components/home/LoginCard';
import UserInfo from '../../components/home/UserInfo';
import { ListItemIcon } from '@mui/material';
import { LuSignpost } from "react-icons/lu";
import { RiAdvertisementLine,RiProductHuntLine  } from "react-icons/ri";
const getMainNavItems = (authenticated) => {
  const items = [
    { icon: <HomeIcon className="w-6 h-6 text-[#454545]" size={18} />, label: "Home", url: "/" },
    { icon: <LuSignpost className="w-6 h-6 text-[#454545]"/>, label: "Post", url: "/admin/posts" },
    { icon: <RiAdvertisementLine className="w-6 h-6 text-[#454545]" />, label: "Advertise", url: "/admin/advertise" },
    { icon: <RiAdvertisementLine className="w-6 h-6 text-[#454545]" />, label: "Sponsored", url: "/admin/sponsored" },
    { icon: <RiProductHuntLine className="w-6 h-6 text-[#454545]"/>, label: "Product", url: "/admin/products" },
  ];

  return items.filter((item) => !item.auth || authenticated);
};



const LeftSide = (props) => {
  const navigate = useNavigate(); 

 
  return (<div className="w-full max-w-md mx-auto bg-white">
        {/* Nav Links + Social */}
        <div className={`w-full py-6 px-2 mt-3 ${props.user.authenticated ? '' : 'border border-gray-300'} rounded-xl p-6 mx-auto bg-white`}>
          <div className="flex flex-col gap-0.5 px-1">
            {getMainNavItems(props.user.authenticated).map((item, i) => (
              <div
                key={i}
                className="flex items-center hover:bg-gray-100 px-2 py-1 rounded-md cursor-pointer relative"
                onClick={() => {
                  item.type === 'other' ? window.open(item.url) : navigate(item.url);
                }}
              >
                <div className="min-w-[28px] flex justify-center items-center">{item.icon}</div>
                <span className="ml-4 text-[#454545] text-base font-medium leading-none">{item.label}</span>
                {item.showBadge && (
                  <div className="absolute -top-1 left-6 w-4 h-4 text-xs bg-red-600 text-white rounded-full flex items-center justify-center">
                    {item.badgeCount}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
            
    )
}

const mapStateToProps = (state) => ({
    keyword: state.post.keyword,
    unReadMessages: state.base.unReadMessages,
    user: state.user,
  });
  
export default connect(
    mapStateToProps,
    {   }
)(LeftSide);
  

