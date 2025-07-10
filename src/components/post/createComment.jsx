
import { useState, useRef, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FaRegImage } from 'react-icons/fa6';
import { MdOutlineCameraAlt } from 'react-icons/md';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import Popover from '@mui/material/Popover';
import '../../pages/post/post.css';
import CommentEditor from './commentEditor';
import WebcamCapture from './webcamCapture';
import { EmojiIcon } from '../ui/icons';
import { convertToWebp } from '../../utils';
import { updateBaseStore } from '../../store/actions/baseActions';
import { createComment } from '../../store/actions/postActions';
import { toast } from 'react-toastify';

const MAX_FILE_MB = 25;

const CreateComment = ({ postId, setUpdateComments, setRecommendations }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const base = useSelector((state) => state.base);
  const { capturedImage, captureCamera } = base;
  const [quill, setQuill] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (capturedImage && quill) {
      insertImageWithDelete(quill, capturedImage);
      dispatch(updateBaseStore({ capturedImage: null }));
    }
  }, [capturedImage, quill]);

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

  const insertEmoji = (emoji) => {
    const range = quill?.getSelection(true);
    if (range) {
      quill.insertText(range.index, emoji.native);
      quill.setSelection(range.index + emoji.native.length);
      quill.focus();
      setAnchorEl(null);
    }
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
      if (fileType === 'image') {
        const result = await convertToWebp(file);
        insertImageWithDelete(quill, result.dataUrl);
      } else if (fileType === 'video') {
        const fileSrc = URL.createObjectURL(file);
        insertVideoWithDelete(quill, fileSrc);
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Failed to process file.');
    } finally {
      e.target.value = '';
    }
  };

  const handleCreateComment = () => {
    if (!quill || quill.getText().trim() === '') return toast.warning('Please input new comment content.');
    dispatch(createComment({ quill, postId }))
      .then((res) => {
        if (res) {
          quill.setText('');
          const fullComment = { ...res, };

          if (typeof setUpdateComments === 'function') {
            setUpdateComments((prev) => ({
              ...prev,
              comments: [fullComment, ...prev.comments],
              lastComment: fullComment,
            }));
          }

          if (typeof setRecommendations === 'function') {
            setRecommendations((prev) => ({
              ...prev,
              commentsCount: (prev.commentsCount || 0) + 1,
            }));
          }
        }
      }).catch((err) => {
        console.warn('Comment not created:', err);
      });
  };

  return (
    <div className="create-post">
      <div className="w-full">
        <div className="w-full px-1 py-1 min-h-[20px] outline-none border-none">
          <CommentEditor onReady={setQuill} placeholder="Write a comment." />
        </div>

        <div className="w-full text-left flex flex-row relative pb-1 pt-2 pl-[10px]">
          <FaRegImage className="text-[#949494] cursor-pointer" size={20} onClick={() => fileInputRef.current?.click()} />
          <MdOutlineCameraAlt className="text-[#949494] ml-5 cursor-pointer" size={23} onClick={() => dispatch(updateBaseStore({ captureCamera: true }))} />
          <div className="ml-5 cursor-pointer" onClick={(event) => setAnchorEl(event.currentTarget)}>
            <EmojiIcon />
          </div>
          <Popover
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
            className="bg-[#1976d2] text-white text-sm absolute right-2 rounded-md px-3 py-1"
            onClick={handleCreateComment}
          >
            Post
          </button>
        </div>

        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />

        {captureCamera && <WebcamCapture handleOK={(img) => insertImageWithDelete(quill, img)} />}
      </div>
    </div>
  );
};

export default CreateComment;
