import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { Avatar } from '@mui/material';
import { getFollowers, followAction, resetFollowers } from '../../store/actions/colleagueAction';
import { getUserDataById } from '../../store/actions/userActions';

const Followers = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const { followers, lastFollowerVisible } = useSelector(state => state.colleague);
  const { loading } = useSelector(state => state.base);
  const lastScrollY = useRef(0);
  const location = useLocation();

  const handleAvatarClick = (userId) => {
    if (!user.authenticated) return
    dispatch(getUserDataById(userId)).then((res) => {
      if (res) {
        navigate('/profile/' + userId);
      }
    }).catch((err) => {
      console.log('err',err);
    })
  }
  const handleFollow = (follower) => {
    const followUser = {
      id: follower.followerId,
      username: follower.username,
      photoUrl: follower.photoUrl,
      information: follower.information,
    };
    
    dispatch(followAction(followUser)).then((res) => {
    }).catch((err) => {
      console.error('Error following/unfollowing user:', err);
    });
  };

  const loadFollowers = async () => {
    if (loading || lastFollowerVisible) return;
    try {
      await dispatch(getFollowers());
    } catch (err) {
      console.error('Error loading followers:', err);
    }
  };

  useEffect(() => {
    if (user.authenticated) {
      loadFollowers();
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const isScrollingDown = scrollTop > lastScrollY.current;
      if (
        isScrollingDown &&
        window.innerHeight + scrollTop >= document.body.offsetHeight - 100 &&
        !loading &&
        !lastFollowerVisible
      ) {
        loadFollowers();
      }
      lastScrollY.current = scrollTop;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, lastFollowerVisible]);

  return (
    <div className="w-full px-4 py-2 space-y-2">
      {followers.map((follower, index) => (
        <div
          key={follower.followerId}
          className="w-full bg-white rounded-xl p-4 pb-2 flex flex-col justify-between border border-gray-200 h-full"
        >
          <div className="w-full flex items-center gap-4 cursor-pointer">
            <Avatar src={follower.photoUrl} alt={follower.username} sx={{ width: 50, height: 50 }}
              onClick={() => { handleAvatarClick(follower.followerId) }}
            />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">@{follower.username}</p>
              <p className="text-sm text-gray-500 truncate">{follower.information || ''}</p>
            </div>
            {user.authenticated && user.id !== follower.followerId && (
              <button
                onClick={() => handleFollow(follower)}
                className="bg-[#161722] text-white px-4 py-1.5 rounded-md text-sm cursor-pointer hover:bg-[#000] transition-colors duration-200"
              >
                {user.follows.includes(follower.followerId) ? 'Unfollow' : 'Follow'}
              </button>
            )}
          </div>
          <div className="flex justify-end mt-1">
            <p className="text-xs text-gray-400 text-right whitespace-nowrap">
              {follower.followedAt?.toDate ? follower.followedAt.toDate().toLocaleString() : ''}
            </p>
          </div>
        </div>
      ))}
    
      {lastFollowerVisible && followers.length > 0 && (
        <div className="w-full text-center py-2 text-gray-500 text-sm">
          No more followers to load
        </div>
      )}
    </div>
  );
};

export default Followers;