
import { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { Avatar } from '@mui/material';
import { getFollows, followAction, } from '../../store/actions/colleagueAction';

const Following = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const { follows, lastFollowVisible } = useSelector(state => state.colleague);
  const { loading } = useSelector(state => state.base);
  const lastScrollY = useRef(0);

  const loadFollows = async () => {
    if (loading || lastFollowVisible) return;
    try {
      await dispatch(getFollows());
    } catch (err) {
      console.error('Error loading follows:', err);
    }
  };

  useEffect(() => {
    if (user.authenticated) {
      loadFollows();
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
        !lastFollowVisible
      ) {
        loadFollows();
      }
      lastScrollY.current = scrollTop;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, lastFollowVisible]);

  const handleUnfollowing = async (follow) => {
    try {
      const followUser = {
        id: follow.followedId,
        username: follow.username,
        photoUrl: follow.photoUrl,
        information: follow.information,
        followerCount: 0 // This will be updated by followAction
      };
      await dispatch(followAction(followUser));
    } catch (error) {
      console.error('Error unfollowing user:', error);
    }
  };

  return (
    <div className="w-full px-4 py-2 space-y-2">
      {follows.map((follow, index) => (
        <div
          key={follow.followedId}
          className="w-full bg-white rounded-xl shadow-sm p-4 pb-2 flex items-center justify-between border border-gray-200"
        >
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('/profile/' + follow.followedId)}
          >
            <Avatar src={follow.photoUrl} alt={follow.username} sx={{ width: 50, height: 50 }} />
            <div>
              <p className="text-sm font-semibold text-gray-900">@{follow.username}</p>
              <p className="text-sm text-gray-500">{follow.information || ''}</p>
            </div>
          </div>
          <button
            onClick={() => handleUnfollowing(follow)}
            className="bg-[#161722] text-white px-4 py-1.5 rounded-md text-sm cursor-pointer hover:bg-black"
          >
            Unfollow
          </button>
        </div>
      ))}
      
      {lastFollowVisible && follows.length > 0 && (
        <div className="w-full text-center py-2 text-gray-500 text-sm">
          No more follows to load
        </div>
      )}
    </div>
  );
};

export default Following;
