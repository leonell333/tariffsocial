import React, {useEffect, useRef, useState} from 'react';
import {Gift, Paperclip, Send, Smile} from 'lucide-react';
import {GiphyFetch} from '@giphy/js-fetch-api';
import {Grid} from '@giphy/react-components';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import Popover from '@mui/material/Popover';
import {useDispatch, useSelector} from 'react-redux';
import {sendMessageToSingleUser} from '../../store/actions/chatAction';

const gf = new GiphyFetch('pLURtkhVrUXr3KG25Gy5IvzziV5OrZGa');

const isOnlyEmojis = (str) => {
  const emojiRegex = /^(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff]|\s)+$/;
  return emojiRegex.test(str);
};

const InputArea = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const chat = useSelector((state) => state.chat);
  const selectedUserId = chat.selectedUserId;
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [anchorPosition, setAnchorPosition] = useState({ top: 0, left: 0 });
  const fileInputRef = useRef(null);
  const gifInputRef = useRef(null);
  const textareaRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const gifPickerRef = useRef(null);

  useEffect(() => () => attachments.forEach((a) => a.preview && URL.revokeObjectURL(a.preview)), []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 128);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [message]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        gifPickerRef.current &&
        !gifPickerRef.current.contains(event.target) &&
        !document.getElementById('gif-button')?.contains(event.target)
      ) {
        setShowGifPicker(false);
      }
    };
    if (showGifPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showGifPicker]);

  const MAX_FILE_SIZE_MB = 20;

  const handleFileSelect = (file) => {
    const newFileSize = file.size;
    const currentTotalSize = attachments.reduce((sum, a) => sum + a.file.size, 0);
    const totalSizeMB = (currentTotalSize + newFileSize) / (1024 * 1024);
    if (totalSizeMB > MAX_FILE_SIZE_MB) {
      return;
    }
    const type = file.type.startsWith('image/')
      ? (file.type === 'image/gif' ? 'gif' : 'image')
      : 'file';
    const preview = (type === 'image' || type === 'gif') ? URL.createObjectURL(file) : undefined;
    setAttachments((prev) => [...prev, { file, type, preview }]);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) handleFileSelect(file);
    event.target.value = '';
  };

  const handleSendMessage = async () => {
    if (!selectedUserId) {
      return;
    }
    if (!message.trim() && attachments.length === 0) {
      return;
    }
    setIsSending(true);
    const messageType = isOnlyEmojis(message.trim()) ? 'emoji' : 'text';
    dispatch(sendMessageToSingleUser(message, attachments, messageType))
      .then((success) => {
        if (success) {
          setMessage('');
          setAttachments([]);
        }
      }).catch((err) => {
        console.error('Error sending message:', err);
      }).finally(() => {
        setIsSending(false);
      });
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiSelect = (emoji) => {
    setMessage((prev) => prev + emoji.native);
    setAnchorEl(null);
    textareaRef.current?.focus();
  };

  const handleGifSelect = async (gif) => {
    try {
      const res = await fetch(gif.images.original.url);
      const blob = await res.blob();
      const newFileSize = blob.size;
      const currentTotalSize = attachments.reduce((sum, a) => sum + a.file.size, 0);
      const totalSizeMB = (currentTotalSize + newFileSize) / (1024 * 1024);
      if (totalSizeMB > MAX_FILE_SIZE_MB) {
        return;
      }
      const file = new File([blob], `${gif.id}.gif`, { type: 'image/gif' });
      const preview = URL.createObjectURL(file);
      setAttachments((prev) => [...prev, { file, type: 'gif', preview }]);
      setShowGifPicker(false);
      setSearchQuery('');
    } catch (err) {
      console.error('Failed to fetch GIF:', err);
    }
  };

  const handleRemoveAttachment = (index) => {
    const attachment = attachments[index];
    if (attachment.preview) URL.revokeObjectURL(attachment.preview);
    setAttachments((prev) => prev.filter((_, i) => i !== index));
    if (previewImage === attachment.preview) setPreviewImage(null);
  };

  const handlePreviewClick = (preview) => setPreviewImage(preview);
  const closePreview = () => setPreviewImage(null);

  return (
    <div className="w-full px-3 py-1 bg-white border-t border-gray-200 rounded-b-[10px]">
      <div className="relative">

        <input type="file" ref={fileInputRef} accept="*/*" className="hidden" onChange={handleFileChange} />

        {showGifPicker && (
          <div ref={gifPickerRef} className="absolute bottom-full mb-2 right-3 bg-white rounded-lg shadow-lg border border-gray-200 
            p-2 w-[333px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search GIFs..."
              className="w-full p-2 mb-2 rounded border border-gray-200 bg-gray-50"
            />
            <div className="h-[300px] overflow-y-auto">
              <Grid
                key={searchQuery}
                width={300}
                columns={2}
                fetchGifs={(offset) =>
                  searchQuery
                    ? gf.search(searchQuery, { offset, limit: 10 })
                    : gf.trending({ offset, limit: 10 })
                }
                onGifClick={handleGifSelect}
                noLink={true}
              />
            </div>
          </div>
        )}

         {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-3">
            {attachments.map((a, i) => (
              <div key={i} className="relative group">
                {(a.type === 'image' || a.type === 'gif') ? (
                  <div className="w-24 h-24 overflow-hidden rounded-lg shadow relative cursor-pointer" onClick={() => handlePreviewClick(a.preview)}>
                    <img src={a.preview} className="w-full h-full object-cover" alt="preview" />
                  </div>
                ) : (
                  <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-1 relative">
                    📄 <span className="max-w-[150px] truncate">{a.file.name}</span>
                  </div>
                )}
                {!a.uploading && (
                  <button onClick={() => handleRemoveAttachment(i)} className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center">×</button>
                )}
              </div>
            ))}
          </div>
        )}

        {previewImage && (
          <div className="fixed inset-0 z-[9999] bg-black bg-opacity-80 flex items-center justify-center" onClick={closePreview}>
            <img
              src={previewImage}
              alt="Preview"
              className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={closePreview}
              className="absolute top-4 right-4 text-white text-xl font-bold"
            >✕</button>
          </div>
        )}

        <div className="flex items-center space-x-2 bg-gray-100 rounded-2xl relative z-0">
          <textarea ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-gray-800 resize-none ml-2 py-2 outline-none max-h-32 overflow-y-auto custom-scrollbar"
            rows={1}
          />
          <div className="flex items-center space-x-1 py-1 px-1">
            <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-200 transition-colors cursor-pointer" aria-label="Attach file">
              <Paperclip size={20} className="h-5 w-5" />
            </button>
            <button id="gif-button" onClick={() => setShowGifPicker(!showGifPicker)} className="p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-200 transition-colors cursor-pointer" aria-label="Add GIF">
              <Gift size={20} className="h-5 w-5" />
            </button>
            <button id="emoji-button"onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setAnchorPosition({
                top: rect.top - 453,
                left: rect.left - 270,
              });
              setAnchorEl(e.currentTarget);
            }}
              className="p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-200 transition-colors cursor-pointer" aria-label="Add emoji">
              <Smile size={20} className="h-5 w-5" />
            </button>
            {/* <button className="p-2 text-gray-500 hover:text-indigo-600 rounded-full hover:bg-gray-200 transition-colors" aria-label="Voice message">
              <Mic size={20} className="h-5 w-5" />
            </button> */}
            <button
              onClick={() => { setIsSending(true); handleSendMessage() }}
              disabled={isSending}
              className={`p-2 rounded-full transition-colors ${
                message.trim() || attachments.length > 0
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              aria-label="Send message"
            >
              <Send size={20} className="h-5 w-5" />
            </button>
          </div>

          <Popover
            id="emoji_popup"
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            anchorReference="anchorPosition"
            anchorPosition={anchorPosition}
            disableScrollLock
            PaperProps={{ className: 'custom-emoji-popover' }}
          >
            <Picker data={data} onEmojiSelect={handleEmojiSelect} native />
          </Popover>
        </div>
      </div>
    </div>  
  );
};

export default InputArea;