
import { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router';
import { Avatar } from '@mui/material';
import { getColleagues, updateColleagueStore, followAction } from '../../store/actions/colleagueAction';
import { updateUserStore } from '../../store/actions/userActions';

const Colleagues = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const { colleagues, lastColleagueVisible } = useSelector(state => state.colleague);
  const lastScrollY = useRef(0);
  const [isGeting, setIsGeting] = useState(false);
  
  const handleAvatarClick = (colleague) => {
    try {
      dispatch(updateUserStore({ selectedUser: colleague }));
      navigate('/profile/' + colleague.id);
    } catch (err) {
      console.error('Error selecting colleague:', err);
    }
  };

  const handleFollowAction = async (colleagueToFollow) => {
    if (!user.authenticated) {
      return;
    }
    try {
      await dispatch(followAction(colleagueToFollow));
    } catch (err) {
      console.error('Follow action failed:', err);
    }
  };

  useEffect(() => {
    if (user.authenticated) {
      if (colleagues.length > 0) {
        dispatch(updateColleagueStore({
          colleagues: [],
          lastColleague: null,
          lastColleagueVisible: false
        }));
      }
      
      dispatch(getColleagues())
        .then((res) => {
        }).catch(err => console.error(err));
    }
  }, [location.pathname])

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const isScrollingDown = scrollTop > lastScrollY.current;
      if (
        isScrollingDown &&
        window.innerHeight + scrollTop >= document.body.offsetHeight - 100 &&
        !isGeting
      ) {
        setIsGeting(true);
        dispatch(getColleagues()).then((res) => {
          setIsGeting(false);
        }).catch((err) => {
          console.error('Failed to get colleagues:', err);
          setIsGeting(false);
        });
      }
      lastScrollY.current = scrollTop;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isGeting]);

  return (
    <div className="w-full px-4 py-1 space-y-4">
      {colleagues.map((colleague, index) => (
        <div key={colleague.id}
          className="w-full bg-white rounded-xl shadow-sm px-8 p-4 mb-2 flex items-center justify-between border border-gray-200"
        >
          <div
            className="flex items-center gap-3 cursor-pointer flex-1"
            onClick={() => handleAvatarClick(colleague)}
          >
            <Avatar src={colleague.photoUrl} alt={colleague.username} sx={{ width: 50, height: 50 }} />
            <div>
              <p className="text-sm font-medium text-gray-900">@{colleague.username}</p>
              <p className="text-sm text-gray-500">{colleague.information || ''}</p>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-xs text-gray-400">
                  {colleague.postCount || 0} {colleague.postCount === 1 ? 'post' : 'posts'}
                </span>
                <span className="text-xs text-gray-400">
                  {colleague.followerCount || 0} {colleague.followerCount === 1 ? 'follower' : 'followers'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {colleague.id !== user.id && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleFollowAction(colleague);
                }}
                className="bg-[#161722] text-white px-4 py-1.5 rounded-md text-sm hover:bg-black cursor-pointer"
              >
                {user.follows.includes(colleague.id) ? 'Unfollow' : 'Follow'}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Colleagues;