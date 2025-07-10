
import { useEffect, useState, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Avatar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { updateBaseStore } from '../../store/actions/baseActions';
import Post from "../../components/post/post"
import { getColleagues, followAction } from '../../store/actions/colleagueAction';
import { updateUserStore } from '../../store/actions/userActions';
import { getUsers, searchUsersByUsername, getTotalUserCount } from '../../store/actions/chatAction';
import { getPostsByUser } from '../../store/actions/postActions';

const Recommendations = (props) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const chat = useSelector((state) => state.chat);
  const { userPosts } = useSelector((state) => state.post);
  const { loading } = useSelector((state) => state.base);
  const { users, searchUsers, totalUserCount, lastUserVisible, lastSearchUserVisible } = chat;
  const [searchKey, setSearchKey] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [searching, setSearching] = useState(false);
  const lastScrollY = useRef(0);

  const handleFollowAction = async (userToFollow) => {
    if (!user.authenticated) return;
    try {
      await dispatch(followAction(userToFollow));
    } catch (err) {
      console.error('Follow action failed:', err);
    }
  };

  const handleUserSelect = async (selectedUser) => {
    setSelectedUser(selectedUser);
    if (selectedUser.postCount > 0) {
      try {
        await dispatch(getPostsByUser(selectedUser.id, true));
      } catch (err) {
        console.error('Error fetching posts for user:', err);
      }
    }
  };

  const handleAvatarClick = (userToView) => {
    try {
      dispatch(updateUserStore({ selectedUser: userToView }));
      navigate('/profile/' + userToView.id);
    } catch (err) {
      console.error('Error selecting user:', err);
    }
  };

  const loadMoreUsers = async () => {
    if (loading || (searchKey.trim() ? lastSearchUserVisible : lastUserVisible)) return;
    try {
      if (searchKey.trim()) {
        await dispatch(searchUsersByUsername(searchKey.trim(), false));
      } else {
        await dispatch(getUsers(false));
      }
    } catch (err) {
      console.error('Error loading more users:', err);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const isScrollingDown = scrollTop > lastScrollY.current;
      if (
        isScrollingDown &&
        window.innerHeight + scrollTop >= document.body.offsetHeight - 100 &&
        !loading &&
        !(searchKey.trim() ? lastSearchUserVisible : lastUserVisible)
      ) {
        loadMoreUsers();
      }
      lastScrollY.current = scrollTop;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, lastUserVisible, lastSearchUserVisible, searchKey]);

  useEffect(() => {
    if (!searchKey.trim()) {
      dispatch(getUsers(true));
      dispatch(getTotalUserCount());
      return;
    }
    setSearching(true);
    const delay = setTimeout(() => {
      dispatch(searchUsersByUsername(searchKey.trim(), true))
        .then(() => {
          setSearching(false);
          dispatch(getTotalUserCount(searchKey.trim()));
        })
        .catch(() => setSearching(false));
    }, 500);
    return () => clearTimeout(delay);
  }, [searchKey]);

  const currentUsers = searchKey.trim() ? searchUsers : users;
  const currentCount = searchKey.trim() ? totalUserCount : users.length;

   return (
    <div className="w-full bg-white shadow-md min-h-[calc(100vh-107px)] rounded-md p-6 text-black space-y-3" style={{ fontFamily: 'poppins' }}>
      <div className="px-0 pt-0">
        <h2 className="text-xl font-medium text-center">
          Suggested People & Organisations to Follow
          {currentCount > 0 && (
            <span className="text-sm text-gray-500 ml-2">
              ({currentCount} {currentCount === 1 ? 'user' : 'users'})
            </span>
          )}
        </h2>
      </div>

      <div className="h-px bg-gray-200 w-full my-1" />

      <div className="px-0 space-y-4 mt-5">
        {!selectedUser && (
          <>
            <input
              type="text"
              value={searchKey}
              onChange={(e) => {
                setSearchKey(e.target.value);
              }}
              placeholder="Search by name..."
              className="w-full border rounded-md px-4 py-1.5 mb-2 focus-visible:borer-none outline-none"
            />
            {!searching && currentUsers.length === 0 && searchKey.trim() && (
              <div className="text-center text-gray-500">No users found</div>
            )}
            <div className="space-y-2">
              {currentUsers.map((searchUser) => (
                <div key={searchUser.id}
                  className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between cursor-pointer"
                  onClick={() => { handleUserSelect(searchUser); }}
                >
                  <div className="flex items-center gap-4"> 
                    <div 
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAvatarClick(searchUser);
                      }}
                    >
                      <Avatar src={searchUser.photoUrl} alt={searchUser.username} sx={{ width: 50, height: 50 }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">@{searchUser.username}</p>
                      <p className="text-sm text-gray-500">{searchUser.information}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-gray-400">
                          {searchUser.postCount || 0} {searchUser.postCount === 1 ? 'post' : 'posts'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {searchUser.followerCount || 0} {searchUser.followerCount === 1 ? 'follower' : 'followers'}
                        </span>
                      </div>
                    </div>
                  </div>
                  {searchUser.id !== user.id && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFollowAction(searchUser);
                      }}
                      className="bg-[#161722] text-white px-4 py-1.5 rounded-md text-sm hover:bg-black"
                    >
                      {user.follows.includes(searchUser.id) ? 'Unfollow' : 'Follow'}
                    </button>
                  )}
                </div>
              ))}
           
              {(searchKey.trim() ? lastSearchUserVisible : lastUserVisible) && currentUsers.length > 0 && (
                <div className="w-full text-center py-2 text-gray-500 text-sm">
                  No more users to load
                </div>
              )}
              
              {!loading && currentUsers.length === 0 && !searchKey.trim() && (
                <div className="w-full text-center py-2 text-gray-500">
                  No users found
                </div>
              )}
            </div>
          </>
        )}

        {selectedUser && (
          <>
            <div className="flex justify-between items-center mb-2 cursor-pointer"
              onClick={() => { setSelectedUser(null); }}>
              <div className="flex items-center gap-3 cursor-pointer">
                <Avatar src={selectedUser.photoUrl} alt={selectedUser.username} sx={{ width: 50, height: 50 }} />
                <div>
                  <p className="text-md font-semibold text-gray-900">@{selectedUser.username}</p>
                  <p className="text-sm text-gray-500">{selectedUser.information}</p>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs text-gray-400">
                      {userPosts.length} {userPosts.length === 1 ? 'post' : 'posts'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {selectedUser.followerCount || 0} {selectedUser.followerCount === 1 ? 'follower' : 'followers'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedUser.id !== user.id && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFollowAction(selectedUser);
                    }}
                    className="bg-[#161722] text-white px-4 py-1.5 rounded-md text-sm hover:bg-black cursor-pointer"
                  >
                    {user.follows.includes(selectedUser.id) ? 'Unfollow' : 'Follow'}
                  </button>
                )}
              </div>
            </div>

            {userPosts.length > 0 ? (
              <div className="space-y-4">
                {userPosts.map((item) => (
                  <Post key={item.id} post={item} />
                ))}
              </div>
            ) : (
              <div className="text-center py-2">
                <p className="text-gray-500 text-lg mb-2">No posts yet</p>
                <p className="text-gray-400 text-sm">This user hasn't shared any posts.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Recommendations;