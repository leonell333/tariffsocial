
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux'
import { File as FileIcon, Image, Send, User, Paperclip, Users, Gift } from 'lucide-react';
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import Popover from '@mui/material/Popover'
import { EmojiIcon } from '../../components/ui/icons'
import defaultAvatar from '../../assets/images/user.jpg';
import { GiphyFetch } from '@giphy/js-fetch-api';
import { Grid } from '@giphy/react-components';
import { toast } from 'react-toastify';
import ImagePreviewModal from '../../components/post/imagePreviewModal';
import { updateChatStore, getUsers, getDmState, searchUsersByUsername, sendMessageWithAttachments, getMessageHistoryWithUser } from '../../store/actions/chatAction';
import { updateBaseStore } from '../../store/actions/baseActions';

const gf = new GiphyFetch('pLURtkhVrUXr3KG25Gy5IvzziV5OrZGa');
const MAX_FILE_SIZE_MB = 20;

const DirectMessageWindow = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const chat = useSelector((state) => state.chat);
  const { users, searchUsers, selectedUsers = [] } = chat;
  const [userListShow, setUserlistShow] = useState(false);
  const [searchKey, setSearchKey] = useState('');
  const [userSearch, setUserSearch] = useState('')
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [anchorPosition, setAnchorPosition] = useState({ top: 0, left: 0 });
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifSearchQuery, setGifSearchQuery] = useState('');
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const textareaRef = useRef(null);
  const gifPickerRef = useRef(null);
  const gifButtonRef = useRef(null);
  const dropdownRef = useRef(null);

  const iconActions = [
    { id: 'camera', icon: <Image />, tip: 'Take a photo', onClick: () => startCamera() },
    { id: 'file', icon: <Paperclip size={20} className="h-5 w-5" />, tip: 'Attach a file', 
      onClick: () => fileInputRef.current?.click() },
    {
      id: 'gif',
      icon: <Gift size={20} className="h-5 w-5" />, tip: 'Add a GIF',
      onClick: () => {
        if (gifButtonRef.current) {
          const rect = gifButtonRef.current.getBoundingClientRect();
          setAnchorPosition({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX });
        }
        setShowGifPicker(!showGifPicker);
      }
    },
    {
      id: 'emoji',
      icon: <EmojiIcon />, tip: 'Add an emoji',
      onClick: (e) => setAnchorEl(e.currentTarget)
    },
  ];

  useEffect(() => {
    inputRef.current?.focus();
    dispatch(getUsers()).then((res) => {
      }).catch(err => console.error('Failed to load DMs:', err));
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserlistShow(false);
      }
      if (
        gifPickerRef.current &&
        !gifPickerRef.current.contains(event.target) &&
        gifButtonRef.current &&
        !gifButtonRef.current.contains(event.target)
      ) {
        setShowGifPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSendDM = async () => {
    if (selectedUsers.length === 0) {
      toast.warning('Please select at least one user to send a message.');
      return;
    }
    if (!message.trim() && attachments.length === 0) {
      toast.warning('Please write a message or attach a file.');
      return;
    }
    dispatch(updateBaseStore({ loading: true }));

    dispatch(sendMessageWithAttachments(message, attachments))
      .then((res) => {
        if (res) {
          setMessage('');
          setAttachments([]);
          dispatch(updateChatStore({ selectedUsers: [] }));
        } else {
          toast.warning('Message not sent. You may be blocked by all recipients.');
        }
      }).catch((err) => {
        console.error('Error sending message:', err);
        toast.error('Failed to send message.');
      }).finally(() => {
        dispatch(updateBaseStore({ loading: false }));
      });
  };

  const handleFileSelect = (file) => {
    const newFileSize = file.size;
    const currentTotalSize = attachments.reduce((sum, a) => sum + a.file.size, 0);
    const totalSizeMB = (currentTotalSize + newFileSize) / (1024 * 1024);

    if (totalSizeMB > MAX_FILE_SIZE_MB) {
      toast.warning('Total attachments must be under 20MB.');
      return;
    }

    const type = file.type.startsWith('image/')
      ? (file.type === 'image/gif' ? 'gif' : 'image')
      : 'file';

    const preview = type === 'image' || type === 'gif' ? URL.createObjectURL(file) : undefined;
    setAttachments((prev) => [...prev, { file, type, preview }]);
  };

  const handleGifSelect = async (gif) => {
    try {
      const res = await fetch(gif.images.original.url);
      const blob = await res.blob();
      const newFileSize = blob.size;
      const currentTotalSize = attachments.reduce((sum, a) => sum + a.file.size, 0);
      const totalSizeMB = (currentTotalSize + newFileSize) / (1024 * 1024);

      if (totalSizeMB > MAX_FILE_SIZE_MB) {
        toast.warning('Total attachments must be under 20MB.');
        return;
      }

      const file = new File([blob], `${gif.id}.gif`, { type: 'image/gif' });
      const preview = URL.createObjectURL(file);

      setAttachments((prev) => [...prev, { file, type: 'gif', preview }]);
      setShowGifPicker(false);
      setGifSearchQuery('');
    } catch (err) {
      console.error('Failed to fetch GIF:', err);
      toast.error('Failed to add GIF.');
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) handleFileSelect(file);
    event.target.value = '';
  };

  const handleRemoveAttachment = (index) => {
    const attachment = attachments[index];
    if (attachment.preview) URL.revokeObjectURL(attachment.preview);
    setAttachments((prev) => prev.filter((_, i) => i !== index));
    setPreviewImage(null);
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
      setShowCamera(true);
    } catch {
      alert('Unable to access camera');
    }
  };

  const stopCamera = () => {
    if (stream) stream.getTracks().forEach((track) => track.stop());
    setStream(null);
    setShowCamera(false);
  };

  const takePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) handleFileSelect(new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' }));
      }, 'image/jpeg');
      stopCamera();
    }
  };

  useEffect(() => () => attachments.forEach((a) => a.preview && URL.revokeObjectURL(a.preview)), []);
  useEffect(() => () => stream?.getTracks().forEach((track) => track.stop()), [stream]);

  const handleUserSelect = (selectedUserId) => {
    if (selectedUsers.length >= 3) {
      toast.warn('You can only select up to 3 users.');
      return;
    }

    dispatch(updateChatStore({ messages: [], lastMessage: null, lastMessageVisible: false }));

    dispatch(getDmState(selectedUserId))
      .then((state) => {
        if (state) {
          dispatch(updateChatStore({ selectedUserId }));
          dispatch(getMessageHistoryWithUser(selectedUserId));
          setUserSearch("");
        } else {
          dispatch(updateChatStore({ selectedUsers: [...selectedUsers, selectedUserId] }));
          setSearchKey('');
          setUserSearch('');
        }
      })
      .catch((err) => {
        console.error('Error checking DM:', err);
        toast.error("Failed to check DM status.");
      })
      .finally(() => {
        setUserlistShow(false);
      });
  };


  useEffect(() => {
    if (!searchKey.trim()) return;
    const delay = setTimeout(() => {
      dispatch(updateChatStore({
        searchUsers: [],
        lastSearchUser: null,
        lastSearchUserVisible: false
      }));
      dispatch(searchUsersByUsername(searchKey.trim()))
        .then((res) => {
            if (res) {
              setSearching(!searching);
            }
        }).catch(err => {
          console.error('Search error:', err)
          setSearching(!searching);
        });
    }, 500);
    return () => clearTimeout(delay);
  }, [searchKey]);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 ease-in-out">
      <div className="flex justify-between items-center px-4 py-2 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <img
            src={user?.photoUrl}
            alt={user?.username || 'User'}
            className="h-11 w-11 rounded-full object-cover cursor-pointer"
            onClick={() => navigate('/profile/' + user?.id)}
          />
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {user?.username || 'Anonymous'}
            </h1>
            <p className="text-sm text-gray-500">
            </p>
          </div>
        </div>

        <div className="relative inline-block text-left" ref={dropdownRef}>
          <button
            onClick={() => setUserlistShow(!userListShow)}
            className={`p-2 rounded-full focus:outline-none ${
              userListShow
                ? 'bg-indigo-100'
                : 'text-gray-500 hover:text-indigo-600'
            }`}
            aria-label="Toggle user list"
          >
            <Users size={20} className="h-5 w-5" />
          </button>

          {userListShow && (
            <div className="absolute right-0 mt-2 w-[208px] max-h-[300px] overflow-x-hidden overflow-y-auto bg-white border border-gray-200
             shadow-lg rounded-md z-50 custom-scrollbar">
              <div className="p-2 border-b border-gray-200">
                <input
                  type="text"
                  value={searchKey}
                  onChange={(e) => {
                    setSearchKey(e.target.value);
                    setSearching(!searching);
                  }}
                  placeholder="Search users..."
                  className="w-full px-3 py-1 text-sm bg-gray-100 rounded-md focus:outline-none"
                />
              </div>

              {(searchKey.trim() ? searchUsers : users).length === 0 ? (
                <>
                  { !searching && (<div className="p-4 text-sm text-gray-500">No users found</div>) }
                </>
              ) : (
                (searchKey.trim() ? searchUsers : users).map((user, index) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-2 pt-1 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleUserSelect(user.id)}
                  >
                    <img
                      src={user.photoUrl || defaultAvatar}
                      alt={user.username}
                      className="h-7 w-7 rounded-full object-cover"
                    />
                    <div className="text-sm text-gray-900 truncate">
                      {user.username}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
          
      <div className="p-4 pb-0 pt-2 border-gray-200">
        {selectedUsers.map((userId, i) => (
          <div
            key={userId}
            className="inline-flex items-center gap-2 px-3 py-1 mr-2 border border-gray-300 rounded-full bg-gray-100 max-w-fit cursor-pointer hover:bg-blue-100 transition"
            onClick={() => dispatch(updateChatStore({ selectedUsers: selectedUsers.filter((_, idx) => idx !== i) }))}
          >
            <img
              src={users.find(u => u.id === userId)?.photoUrl || defaultAvatar}
              className="h-6 w-6 rounded-full object-cover"
            />
            <span className="text-sm text-gray-800 font-medium">
              {users.find(u => u.id === userId)?.username}
            </span>
          </div>
        ))}

        <div className="relative w-fit mt-2">
          <div className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-full bg-gray-100 max-w-fit">
            <User size={16} className="text-gray-400" />
            <input
              ref={inputRef}
              value={userSearch}
              onChange={(e) => {
                setSearching(!searching)
                setUserSearch(e.target.value)
                setSearchKey(e.target.value)
              }}
              placeholder="Enter username..."
              className="bg-gray-100 text-sm text-gray-700 focus:outline-none placeholder-gray-400 w-36"
            />
          </div>

          {userSearch.trim() && (searchUsers.length > 0 ? (
            <div className="absolute mt-1 w-full bg-white border border-gray-300 rounded shadow z-10">
              {searchUsers.map((user) => (
                <div key={user.id}
                  onClick={() => handleUserSelect(user.id)}
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-100"
                >
                  <img
                    src={user.photoUrl || defaultAvatar}
                    alt={user.username}
                    className="h-6 w-6 rounded-full object-cover"
                  />
                  <span className="text-sm text-gray-800">{user.username}</span>
                </div>
              ))}
            </div>
          ) : (
            <>
              { !searching && (<div className="absolute mt-1 w-full bg-white border border-gray-300 rounded shadow z-10 px-3 py-2 text-sm text-gray-500">
                No users found</div>) }
            </>
          ))}
        </div>
      </div>

      <div className="p-3">
        <div className="relative">
          <textarea id="message" ref={textareaRef} value={message} 
            onChange={(e) => setMessage(e.target.value)}
            rows={6} placeholder="Type your message here..." 
            className="w-full px-4 py-3 rounded-lg border border-gray-300 resize-none focus:border-gray-400 focus:outline-none" />
          {/* <div className={`absolute bottom-2 right-2 text-xs ${isAtLimit ? 'text-red-500' : isNearLimit ? 'text-yellow-500' : 'text-gray-400'}`}>{charCount}/{MAX_CHARS}</div> */}
        </div>

        {attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-3">
            {attachments.map((a, i) => (
              <div key={i} className="relative group">
                {a.type === 'image' || a.type === 'gif' ? (
                  <div
                    onClick={() => setPreviewImage(a.preview)}
                    className="relative w-24 h-24 rounded-lg overflow-hidden cursor-pointer"
                  >
                    <img src={a.preview} alt={a.file.name} className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-1">
                    <span className="max-w-[150px] truncate">{a.file.name}</span>
                  </div>
                )}
                <button
                  onClick={() => handleRemoveAttachment(i)}
                  className="absolute -top-[1px] -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

      </div>

      <div className="px-4 py-1 mt-1 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-1 ml-4">
          <input type="file" ref={fileInputRef} accept="*/*" className="hidden" onChange={handleFileChange} />

          {iconActions.map(({ id, icon, onClick, tip }) => (
            <div key={id} className="relative">
              <button
                ref={id === 'gif' ? gifButtonRef : null}
                type="button"
                onClick={onClick}
                onMouseEnter={() => setActiveTooltip(id)}
                onMouseLeave={() => setActiveTooltip(null)}
                className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-full"
              >
                {icon}
              </button>

              {activeTooltip === id && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white 
                  text-xs rounded whitespace-nowrap animate-fadeIn">
                  {tip}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 
                    border-transparent border-t-gray-800"></div>
                </div>
              )}
            </div>
          ))}

          {showGifPicker && (
            <div ref={gifPickerRef}
              className="absolute bg-white border border-gray-300 shadow-lg rounded-md p-2 z-[9999]"
              style={{
                top: `${anchorPosition.top - 70}px`,
                left: `${anchorPosition.left - 75}px`,
                position: 'fixed'
              }}
              >
              <input
                type="text"
                value={gifSearchQuery}
                onChange={(e) => setGifSearchQuery(e.target.value)}
                placeholder="Search GIFs..."
                className="w-full mb-2 p-2 rounded border bg-gray-50"
              />
              <div className="h-[300px] overflow-y-auto">
                <Grid
                  width={300}
                  columns={2}
                  fetchGifs={(offset) =>
                    gifSearchQuery
                      ? gf.search(gifSearchQuery, { offset, limit: 10 })
                      : gf.trending({ offset, limit: 10 })
                  }
                  onGifClick={handleGifSelect}
                  noLink
                />
              </div>
            </div>
          )}

          <Popover
            id="emoji_popup"
            open={Boolean(anchorEl)}
            anchorEl={anchorEl}
            onClose={() => setAnchorEl(null)}
            disableScrollLock
          >
            <Picker 
              data={data}
              onEmojiSelect={(emoji) => {
                setMessage((prev) => prev + emoji.native);
                setAnchorEl(null);
              }}
            />
          </Popover>
        </div>

        <button onClick={handleSendDM}
          className={`px-2 py-1 rounded-lg flex items-center gap-2 bg-blue-500 text-white hover:bg-blue-600 cursor-pointer`}>
          <span>Send</span>
          <Send size={18} />
        </button>
      </div>

      <ImagePreviewModal src={previewImage} onClose={() => setPreviewImage(null)}  />

      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg">
            <video ref={videoRef} autoPlay playsInline className="rounded-lg mb-4" style={{ maxWidth: '100%', maxHeight: '70vh' }} />
            <div className="flex justify-center gap-4">
              <button onClick={takePhoto} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Take Photo</button>
              <button onClick={stopCamera} className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectMessageWindow;