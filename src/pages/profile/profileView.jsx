import {useEffect} from 'react'
import {useDispatch, useSelector} from 'react-redux'
import {useNavigate, useParams} from 'react-router';
import CountryFlag from 'react-country-flag'
import {FaCircleMinus} from 'react-icons/fa6'
import Message from '../../components/dm/Message'
import './profile.css'
import {followAction} from '../../store/actions/colleagueAction';
import {updateBaseStore} from '../../store/actions/baseActions';

const ProfileView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const base = useSelector((state) => state.base);
  const { selectedUser, follows } = user;
  const { messageModal } = base;
  const isFollowing = selectedUser ? follows.includes(selectedUser.id) : false;

  useEffect(() => {
    if (!selectedUser) {
      navigate("/");
    }
  }, [selectedUser, navigate]);

  const handleFollow = () => {
    dispatch(followAction(selectedUser)).then((res) => {
    }).catch((err) => {
      console.error('err:', err);
    });
  };

  if (!selectedUser) return null;

  return (
    <>
      <div className="">
        <div className="w-full mx-auto mb-2 border border-gray-200 rounded-xl overflow-hidden">
          <div className="relative">
            <img
              className="w-full h-[157px] object-cover"
              src="/assets/images/profile/back.png"
              alt="Cover"
            />
            <div className="absolute left-20 top-[77px] w-[170px] h-[170px] border-4 border-white rounded-full">
              <img
                className="w-full h-full object-cover rounded-full"
                src={selectedUser.photoUrl}
                alt="Profile"
              />
              {selectedUser.status && (
                <span
                  className={`absolute bottom-4 right-[17px] w-3 h-3 rounded-full border border-white ${
                    selectedUser.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                ></span>
              )}
            </div>
          </div>

          <div className="pt-23 pb-4 px-8 bg-white min-h-[221px]">
            <div className="flex items-start justify-between mb-2">
              <div className="w-full">
                <h2 className="text-[22px] font-medium text-[#181818]">
                  {selectedUser.username}
                </h2>
                <div className="w-full flex justify-between items-center gap-4">
                  {selectedUser.information}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 flex-wrap mt-2">
              <button
                className={`flex items-center gap-2.5 px-6 py-1.5 border border-gray-300 rounded-md hover:bg-gray-100 transition text-sm cursor-pointer`}
                onClick={() => { handleFollow() }}>
                {!isFollowing ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="11.5" fill="#161722" stroke="white" />
                    <line x1="11.7964" y1="18" x2="11.7964" y2="6" stroke="white" strokeWidth="1.5" />
                    <line y1="-0.75" x2="12" y2="-0.75" transform="matrix(-1 0 0 1 18 12.5454)" stroke="white" strokeWidth="1.5" />
                  </svg>
                ) : 
                  <FaCircleMinus className="text-xl" />
                }
                <span className="text-[#181818]">{isFollowing ? "Unfollow" : "Follow"}</span>
              </button>

              <button
                className="px-6 py-1.5 border border-gray-300 rounded-md hover:bg-gray-100 transition text-sm cursor-pointer"
                onClick={() => { dispatch(updateBaseStore({ messageModal: !messageModal })); }}>
                <span
                  className={`text-[#181818]`}>
                  Send a message
                </span>
              </button>

              <button className="px-6 py-1.5 border border-gray-300 rounded-md hover:bg-gray-100 transition text-sm hidden">
                <span className="text-[#181818]">More</span>
              </button>
            </div>
          </div>
        </div>

        <div className={`w-full mx-auto borderborder-gray-200 rounded-md bg-white ${user.role.admin ? "min-h-[457px]" : "min-h-[418px]"}`}>
          <div className="p-8 relative">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-medium text-[#181818] font-['Montserrat',Helvetica] mb-4">
                General Information
              </h3>
            </div>

            <div className="flex w-full gap-4">
              <div className="relative flex items-center gap-4 w-full">
                {selectedUser.description}
              </div>
            </div>

            <div className="space-y-4 mt-5">
              <div className="flex items-center gap-4">
                <label className="w-[100px] text-lg font-medium text-[#181818] font-['Montserrat',Helvetica]">
                  Country:
                </label>
                <div>
                  <CountryFlag
                    className="mr-3 text-2xl"
                    countryCode={selectedUser.country?.countryCode}
                    svg
                  />
                  <span className="text-[15px] text-black font-semibold">{selectedUser.country?.label}</span>
                </div>
              </div>

              {/* skills */}
              <div className="relative mt-6">
                <div className="flex items-start mb-2 w-full">
                  <div className="flex-shrink-0 mr-4">
                    <label className="text-lg font-medium text-[#181818] whitespace-nowrap">
                      Skills:
                    </label>
                  </div>
                  <div className="flex-1 flex flex-wrap gap-2 min-h-[28px] items-center">
                    {selectedUser.skills?.map((skill, idx) =>
                      <span
                        key={idx}
                        className="bg-blue-100 text-xs px-3 py-1 rounded-full transition">
                        {skill}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* services */}
              <div className="relative mt-6">
                <div className="flex items-start mb-2 w-full">
                  <div className="flex-shrink-0 mr-4">
                    <label className="text-lg font-medium text-[#181818] whitespace-nowrap">
                      Services:
                    </label>
                  </div>
                  <div className="flex-1 flex flex-wrap gap-2 min-h-[28px] items-center">
                    {selectedUser.services?.map((service, idx) =>
                      <span
                        key={idx}
                        className="bg-green-100 text-xs px-3 py-1 rounded-full transition">
                        {service}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {messageModal && <Message />}
      </div>
    </>
  )
}

export default ProfileView;