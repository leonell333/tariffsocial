
import { useState, useEffect, useRef, useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { GrUserAdmin } from 'react-icons/gr'
import { CopyrightIcon, HomeIcon, InfoIcon, MailIcon, ClipboardListIcon, } from 'lucide-react'
import LoginCard from '../../components/home/LoginCard'
import UserInfo from '../../components/home/UserInfo'
import { XLogoIcon, InstagramLogoIcon, YoutubeLogoIcon, LinkedInLogoIcon, } from '../../components/ui/icons'
import { getTotalColleagueCount, } from '../../store/actions/colleagueAction'
import { getUnreadCounts } from '../../store/actions/baseActions'

const getMainNavItems = (authenticated) => {
  const items = [
    {
      icon: <HomeIcon className="w-6 h-6 text-[#454545]" size={18} />,
      label: 'Home',
      url: '/',
    },
    {
      icon: <InfoIcon className="w-6 h-6 text-[#454545]" size={18} />,
      label: 'About',
      url: '/info/about',
    },
    {
      icon: (
        <div className="w-6 h-6 text-[#454545]">
          <svg
            width="24"
            height="25"
            viewBox="0 0 24 25"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M2 20.4039C2 21.5039 2.9 22.4039 4 22.4039H20C21.1 22.4039 22 21.5039 22 20.4039V7.40393H17.4045C16.9325 4.84793 14.691 2.90393 12 2.90393C9.309 2.90393 7.0675 4.84793 6.5955 7.40393H2V20.4039ZM12 3.90393C14.1375 3.90393 15.9275 5.40293 16.384 7.40393H7.616C8.0725 5.40293 9.8625 3.90393 12 3.90393ZM6.5 8.40393V11.4039H7.5V8.40393H16.5V11.4039H17.5V8.40393H21V20.4039C21 20.9554 20.5515 21.4039 20 21.4039H4C3.4485 21.4039 3 20.9554 3 20.4039V8.40393H6.5Z"
              fill="#464646"
              stroke="#464646"
            />
          </svg>
        </div>
      ),
      label: 'Shop',
      url: 'https://social-tariff.myshopify.com/',
      type: 'other',
    },
    {
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M16.5 5.5H7.5V6.5H16.5V5.5Z"
            fill="#464646"
            stroke="#464646"
          />
          <path
            d="M16.5 9.5H7.5V10.5H16.5V9.5Z"
            fill="#464646"
            stroke="#464646"
          />
          <path d="M16.5 13H7.5V14H16.5V13Z" fill="#464646" stroke="#464646" />
          <path d="M11.5 17H7.5V18H11.5V17Z" fill="#464646" stroke="#464646" />
          <path
            d="M3 22H7.094H12H16.906H21V2H3V22ZM4 3H20V21H18.5H16.906H15H12H10.5H9H7.094H4V3Z"
            fill="#464646"
            stroke="#464646"
          />
        </svg>
      ),
      label: 'Advertising Rates',
      url: '/info/advertise-rate',
    },
  ]

  return items.filter((item) => !item.auth || authenticated)
}

const legalItems = [
  {
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path d="M16 13H7V14H16V13Z" fill="#464646" stroke="#464646" />
        <path d="M16 16.5H7V17.5H16V16.5Z" fill="#464646" stroke="#464646" />
        <path
          d="M3.5 21.5V2.5C3.5 2.22386 3.72386 2 4 2H12.8029C12.9296 2 13.0515 2.04806 13.1441 2.13447L20.3412 8.85175C20.4425 8.94631 20.5 9.07869 20.5 9.21728V21.5C20.5 21.7761 20.2761 22 20 22H4C3.72386 22 3.5 21.7761 3.5 21.5Z"
          stroke="#464646"
          strokeWidth="2"
        />
        <path
          d="M12.6791 9.50116L12.4965 3.44753L18.7322 9.3024L12.6791 9.50116Z"
          fill="#464646"
        />
      </svg>
    ),
    label: 'Terms',
    url: '/info/terms',
  },
  {
    icon: (
      <div className="w-6 h-6 text-[#454545]">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12.5 17C13.3284 17 14 16.3284 14 15.5C14 14.6716 13.3284 14 12.5 14C11.6716 14 11 14.6716 11 15.5C11 16.3284 11.6716 17 12.5 17Z"
            fill="#464646"
            stroke="#464646"
          />
          <path
            d="M6 22H18C19.1 22 20 21.1 20 20V11C20 9.9 19.1 9 18 9H8.5V7C8.5 5.07 10.0705 3.5 12 3.5C13.9295 3.5 15.5 5.07 15.5 7H16.5C16.5 4.519 14.4815 2.5 12 2.5C9.5185 2.5 7.5 4.519 7.5 7V9H6C4.9 9 4 9.9 4 11V20C4 21.1 4.9 22 6 22ZM5 11C5 10.4485 5.4485 10 6 10H18C18.5515 10 19 10.4485 19 11V20C19 20.5515 18.5515 21 18 21H6C5.4485 21 5 20.5515 5 20V11Z"
            fill="#464646"
            stroke="#464646"
          />
        </svg>
      </div>
    ),
    label: 'Privacy',
    url: '/info/privacy',
  },
  {
    icon: <ClipboardListIcon className="w-6 h-6 text-[#454545]" size={18} />,
    label: 'Code of Conduct',
    url: '/info/conduct',
  },
]

const contactItems = [
  {
    icon: <MailIcon className="w-6 h-6 text-[#454545]" size={18} />,
    label: 'Contact',
    url: '/info/contact',
  },
  {
    icon: <CopyrightIcon className="w-6 h-6 text-[#454545]" size={18} />,
    label: 'Copyright',
    url: '/info/copyright',
  },
]

const socialIcons = [
  {
    icon: <XLogoIcon />,
    alt: 'X logo',
    url: 'https://x.com',
  },
  {
    icon: <InstagramLogoIcon />,
    alt: 'Logo instagram',
    url: 'https://www.instagram.com/tariffsocial/#',
  },
  {
    icon: <YoutubeLogoIcon />,
    alt: 'Logo youtube',
    url: 'https://www.youtube.com/@TariffSocial',
  },
  {
    icon: <LinkedInLogoIcon />,
    alt: 'Linked in',
    url: 'https://www.linkedin.com/company/tariff-social',
  },
]

const LeftSide = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);

  useEffect(() => {
    if (user.authenticated) {
      const promises = [
        dispatch(getTotalColleagueCount()),
        dispatch(getUnreadCounts())
      ];

      Promise.allSettled(promises).then((res) => {
        res.forEach((data, index) => {
          if (data.status === "rejected") {
            const errorMessages = [
              "Error fetching colleague count:",
              "Error fetching followers:",
              "Error fetching unread counts:"
            ];
            console.error(errorMessages[index], data.reason);
          }
        });
      });
    }
  }, [user.authenticated]);

  return (
    <div className="w-full max-w-md mx-auto">
      {user.authenticated ? <UserInfo /> : <LoginCard />}
      <div
        className={`w-full max-w-[357px] min-h-[437px] py-4 mt-2 border border-[#EBEBEB]  ${
          user.authenticated ? '' : 'border border-gray-300'
        } rounded-xl mx-auto bg-white`}>
        <div className="flex flex-col gap-0.5">
          {getMainNavItems(user.authenticated).map((item, i) => (
            <div key={i}
              className={`flex items-center hover:bg-gray-100 pr-8 px-10 py-1.5 rounded-md cursor-pointer relative ${
                !user.authenticated && item.auth
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-gray-100 cursor-pointer'
              }`}
              onClick={() => {
                item.type === 'other'
                  ? window.open(item.url)
                  : navigate(item.url)
              }}>
              <div className="min-w-[28px] flex justify-center items-center">
                {item.icon}
              </div>
              <span className="ml-4 text-[#454545] text-base font-medium leading-none">
                {item.label}
              </span>
              {item.showBadge && (
                <div className="absolute -top-1 left-6 w-4 h-4 text-xs bg-red-600 text-white rounded-full flex items-center justify-center">
                  {item.badgeCount}
                </div>
              )}
            </div>
          ))}

          <div className="h-px bg-gray-200 w-4/5 my-2 ml-3" />

          {legalItems.map((item, i) => (
            <div
              key={i}
              className="flex items-center hover:bg-gray-100 px-10 py-1.5 rounded-md cursor-pointer relative"
              onClick={() => navigate(item.url)}
            >
              <div className="min-w-[28px] flex justify-center items-center">
                {item.icon}
              </div>
              <span className="ml-4 text-base font-medium leading-none">
                {item.label}
              </span>
            </div>
          ))}

          <div className="h-px bg-gray-200 w-4/5 my-2 ml-3" />

          {contactItems.map((item, i) => (
            <div
              key={i}
              className="flex items-center hover:bg-gray-100 px-10 py-1.5 rounded-md cursor-pointer"
              onClick={() => navigate(item.url)}>
              <div className="min-w-[28px] flex justify-center items-center">
                {item.icon}
              </div>
              <span className="ml-4 text-[#454545] text-base font-medium leading-none">
                {item.label}
              </span>
            </div>
          ))}

          {user.role?.admin && (
            <div
              className="flex items-center hover:bg-gray-100 px-10 py-1.5 rounded-md cursor-pointer"
              onClick={() => navigate('/admin')}>
              <div className="min-w-[28px] flex justify-center items-center">
                <GrUserAdmin size={24} />
              </div>
              <span className="ml-4 text-[#454545] text-base font-medium leading-none">
                Admin
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-5 mx-auto pt-4 pb-[10px] sm:px-4">
          {socialIcons.map((icon, index) => (
            <button
              key={index}
              className="w-6 h-6 p-0 cursor-pointer"
              onClick={() => window.open(icon.url)}>
              {icon.icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default LeftSide;