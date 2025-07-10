import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import TextField from '@mui/material/TextField'
import WebcamCapture from './webcamCapture'
import Avatar from '@mui/material/Avatar'
import Popover from '@mui/material/Popover'
import { AiOutlineCloseCircle } from 'react-icons/ai'
import { FaRegImage, FaHashtag } from 'react-icons/fa6'
import { MdOutlineCameraAlt, MdOutlineLocationOn } from 'react-icons/md'
import axios from 'axios'
import { EmojiIcon } from '../ui/icons'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import '../../pages/post/post.css'
import { updatePostStore, createPost } from '../../store/actions/postActions'
import { updateBaseStore } from '../../store/actions/baseActions'
import PostEditor from './postEditor'
import { toast } from 'react-toastify'
import { convertToWebp, compressVideoClientSide } from '../../utils'

const MAX_FILE_MB = 25;

const CreatePost = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const base = useSelector((state) => state.base);
  const { tags, capturedImage, captureCamera } = base;
  const [quill, setQuill] = useState(undefined);
  const [anchorEl, setAnchorEl] = useState(null);
  const [tagInput, setTagInput] = useState('');
  const [updateTags, setUpdateTags] = useState([]);
  const [selectingTag, setSelectingTag] = useState(false);
  const [selectingAddress, setSelectingAddress] = useState(false);
  const [addressInput, setAddressInput] = useState('');
  const [addressSearchResults, setAddressSearchResults] = useState([]);
  const [address, setAddress] = useState('');
  const fileInputRef = useRef(null);
  const [placeholder, setPlaceholder] = useState("Trading Post.");

  const insertImageWithDelete = (quillInstance, imageSrc) => {
    const range = quillInstance.getSelection(true);
    quillInstance.insertEmbed(range.index, 'imageBlot', imageSrc);
    setTimeout(() => {
      quillInstance.setSelection(range.index + 1);
      quillInstance.focus();
    }, 50);
  };

  const insertVideoWithDelete = (quillInstance, videoSrc) => {
    const range = quillInstance.getSelection(true);
    quillInstance.insertEmbed(range.index, 'videoBlot', videoSrc);
    setTimeout(() => {
      quillInstance.setSelection(range.index + 1);
      quillInstance.focus();
    }, 50);
  };

  const insertCapturedImage = (capturedImage) => {
    insertImageWithDelete(quill, capturedImage);
  };

  const insertEmoji = (emoji) => {
    const range = quill.selection.savedRange;
    if (range) {
      quill.insertText(range.index, emoji.native);
      quill.setSelection(range.index + emoji.native.length);
      quill.focus();
      setAnchorEl(null);
    }
  };

  const addTag = (tag) => {
    if (tag && !updateTags.includes(tag)) {
      setUpdateTags([...updateTags, tag]);
    }
  };

  const removeTag = (tag) => {
    setUpdateTags(updateTags.filter(t => t !== tag));
  };

  const handleTagKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput.trim());
      setTagInput('');
    }
  };

  let debounceTimer;
  const handleAddressInputKeyDown = (e) => {
    clearTimeout(debounceTimer);
    const value = e.target.value;
    setAddress(value);
    if (value.length < 3) {
      setAddressSearchResults([]);
      return;
    }
    debounceTimer = setTimeout(async () => {
      try {
        const res = await axios.get(
          `https://nominatim.openstreetmap.org/search`,
          {
            params: {
              q: value,
              format: 'jsonv2',
              limit: 5,
              addressdetails: 1,
            },
            headers: {
              'Accept-Language': 'en',
            },
          }
        );
        if (res.data) setAddressSearchResults(res.data);
      } catch (err) {
        console.error('Address fetch error:', err);
      }
    }, 1000);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !quill) return;
    const fileType = file.type.split('/')[0];
    const fileSizeMB = file.size / 1024 / 1024;

    if (fileSizeMB > MAX_FILE_MB) {
      toast.error('File size exceeds 50MB limit.');
      e.target.value = '';
      return;
    }
    try {
      const range = quill.getSelection(true);
      if (fileType === 'image') {
        const result = await convertToWebp(file);
        // console.log(`%c Original: ${(result.originalSize / 1024).toFixed(2)} KB`, 'color: orange');
        // console.log(`%c WebP: ${(result.webpSize / 1024).toFixed(2)} KB`, 'color: green');
        insertImageWithDelete(quill, result.dataUrl);
      } else if (fileType === 'video') {
        const fileSrc = URL.createObjectURL(file);
        insertVideoWithDelete(quill, fileSrc);
      }
    } catch (err) {
      console.error('Compression failed:', err);
      toast.error('Failed to process file.');
    } finally {
      e.target.value = '';
    }
  };

  const create = () => {
    if (!quill) return;
    const html = quill.root.innerHTML;
    const textContent = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim();
    const isHtmlEmpty =
      textContent === '' &&
      (
        html === '<p><br></p>' ||
        html === '<div><br></div>' ||
        html === '<p></p>' ||
        html === '<div></div>' ||
        html.trim() === ''
      );
    if (isHtmlEmpty) {
      toast.warn('Please enter content.');
      return;
    }

    dispatch(createPost({ quill, tags: updateTags, address }))
      .then((res) => {
        if (res) {
          if (quill && quill.root) {
            quill.root.innerHTML = '';
          }
          setQuill("");
          setUpdateTags([]);
          setAddress('');
          dispatch(updateBaseStore({ capturedImage: null }));
        }
      })
      .catch((error) => {
        toast.error('Failed to create post.');
      });
  };

  return (
    <div className="create-post">
      <div className="flex flex-row mb-3">
        <Avatar
          src={user.photoUrl}
          sx={{ width: 30, height: 30 }}
          className="cursor-pointer ml-[5px]"
          onClick={() => navigate('/profile/' + id)}
        />
        <div className="flex-grow w-90">
          <div>
            <PostEditor onReady={setQuill} placeholder={placeholder} />
          </div>
          
          {address && (
            <div className="flex flex-wrap gap-2 pl-1 mt-1">
              <span className="bg-blue-200 text-[13px] text-black font-semibold px-3 py-[1px] rounded-full transition cursor-pointer"
                title="Click to remove"
                  onClick={() => {
                    setAddress('');
                    setAddressInput('');
                }}>
                {address}
              </span>
            </div>
          )}

          {updateTags.length !== 0 && (
            <div className="flex flex-wrap gap-2 pl-1 mt-1">
              {updateTags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-green-100 text-[13px] text-black font-semibold px-3 py-[2px] rounded-full transition cursor-pointer"
                  onClick={() => removeTag(tag)}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="w-full text-left flex flex-row relative mt-1 h-max mb-[10px]">
        <FaRegImage className="text-[#949494] cursor-pointer ml-2" size={20} 
          onClick={() => fileInputRef.current?.click()} />

        <MdOutlineCameraAlt className="text-[#949494] ml-5 cursor-pointer" size={23} 
          onClick={() => dispatch(updateBaseStore({ captureCamera: true }))} />

        <MdOutlineLocationOn className="text-[#949494] ml-5 cursor-pointer" size={21} 
          onClick={() => {
            setSelectingAddress(!selectingAddress);
            setSelectingTag(false);
          }} />

        <FaHashtag className="text-[#949494] ml-5 cursor-pointer" size={18} 
          onClick={() => {
            setSelectingTag(!selectingTag);
            setSelectingAddress(false);
          }} />

        <div className="ml-5 cursor-pointer" onClick={(event) => setAnchorEl(event.currentTarget)}>
          <EmojiIcon />
        </div>

        <Popover
          id="emoji_popup"
          open={Boolean(anchorEl)}
          anchorEl={anchorEl}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          disableScrollLock
        >
          <Picker data={data} onEmojiSelect={insertEmoji} />
        </Popover>

        <button
          type="button"
          className="bg-[#1976d2] text-[18px] text-white text-sm absolute right-2 cursor-pointer rounded-md h-max w-19 px-[4px]"
          onClick={create}
        >Post</button>
      </div>

      <input
        type="file"
        accept="image/*,video/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      {selectingAddress && (
        <div className="border-none py-1 px-[10px] w-full bg-white relative">
          <TextField
            value={addressInput}
            className="w-full pl-1 m-0 !p-0"
            onChange={(e) => setAddressInput(e.target.value)}
            onKeyUp={handleAddressInputKeyDown}
            variant="standard"
            placeholder="Search the place"
          />
          <AiOutlineCloseCircle
            className="absolute text-15 top-1 right-2 cursor-pointer text-[#666666]"
            size={20}
            onClick={() => setSelectingAddress(false)}
          />
          {addressInput && (
            <ul className="mt-1 bg-white border-none rounded shadow text-sm">
              {addressSearchResults.map((addr) => (
                <li
                  key={addr.place_id}
                  onClick={() => {
                    setAddress(addr.display_name);
                    setAddressInput(addr.display_name);
                  }}
                  style={{ borderBottom: 'solid 1px #BEBEBE' }}
                  className="px-3 hover:bg-gray-100 cursor-pointer mb-1 text-[14px] pt-[1px]"
                >
                  <strong>{addr.address?.city || addr.address?.village || addr.address?.state || ''}</strong>
                  {addr.address?.country && `, ${addr.address.country}`}
                  <div className="text-[12px] text-[#999]">{addr.display_name}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {selectingTag && (
        <div className="border-none px-[10px] py-1 w-full bg-white relative">
          <input
            type="text"
            className="outline-none w-full border-b-[#BEBEBE] border-b"
            placeholder="Type or select a tag"
            value={tagInput}
            onKeyDown={handleTagKeyDown}
            onChange={(e) => setTagInput(e.target.value)}
          />

          <AiOutlineCloseCircle
            className="absolute text-15 top-1 right-2 cursor-pointer text-[#666666]"
            size={20}
            onClick={() => setSelectingTag(false)}
          />

          {tagInput && (
            <ul className="mt-1 bg-white border-none rounded shadow text-sm">
              {tags.map(tagObj => tagObj.tag)
                .filter(
                  (tag) =>
                    tag.toLowerCase().includes(tagInput.toLowerCase()) &&
                    !updateTags.includes(tag)
                )
                .map((tag, idx) => (
                  <li
                    key={idx}
                    onClick={() => {
                      addTag(tag);
                      setTagInput('');
                    }}
                    style={{ borderBottom: 'solid 1px #BEBEBE' }}
                    className="px-3 hover:bg-gray-100 cursor-pointer py-1 text-[14px]"
                  >
                    # {tag}
                  </li>
                ))}
            </ul>
          )}
        </div>
      )}

      {captureCamera && <WebcamCapture handleOK={insertCapturedImage} />}
    </div>
  );
};

export default CreatePost;
