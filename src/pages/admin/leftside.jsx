import {useSelector} from 'react-redux';
import {useNavigate} from 'react-router';
import {HomeIcon, FileText, Megaphone, Package, User} from 'lucide-react';

const getMainNavItems = (authenticated) => {
  const items = [
    { icon: <HomeIcon className="w-6 h-6 text-[#454545]" />, label: "Dashboard", url: "/admin/dashboard" },
    { icon: <User className="w-6 h-6 text-[#454545]" />, label: "Users", url: "/admin/users" },
    { icon: <FileText className="w-6 h-6 text-[#454545]"/>, label: "Post", url: "/admin/posts" },
    { icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-megaphone-icon lucide-megaphone"><path d="M11 6a13 13 0 0 0 8.4-2.8A1 1 0 0 1 21 4v12a1 1 0 0 1-1.6.8A13 13 0 0 0 11 14H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"/><path d="M6 14a12 12 0 0 0 2.4 7.2 2 2 0 0 0 3.2-2.4A8 8 0 0 1 10 14"/><path d="M8 6v8"/></svg>, 
      label: "Advertise", url: "/admin/advertise" },
    { icon: <Megaphone className="w-6 h-6 text-[#454545]" />, label: "Sponsored", url: "/admin/sponsored" },
    { icon: <Package className="w-6 h-6 text-[#454545]"/>, label: "Product", url: "/admin/products" },
  ];

  return items.filter((item) => !item.auth || authenticated);
};

const AdminLeftSide = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.user);

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        className={`w-full max-w-[357px] py-2 border border-[#EBEBEB]  ${
          user.authenticated ? '' : 'border border-gray-300'
        } rounded-xl mx-auto bg-white`}>
        <div className="flex flex-col gap-0.5 min-h-[calc(100vh-50px)]">
          {getMainNavItems(user.authenticated).map((item, i) => (
            <div
              key={i}
              className={`flex items-center hover:bg-gray-100 mt-2 px-10 py-1.5 rounded-md cursor-pointer relative ${
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
        </div>
      </div>
    </div>
  )
}

export default AdminLeftSide;
