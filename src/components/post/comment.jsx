import {useEffect, useState} from 'react';
import {getAuth} from "firebase/auth";
import {useDispatch} from 'react-redux'
import {Avatar, Popover} from '@mui/material';
import {CircleX, MoreHorizontalIcon, Pencil, Save, Trash} from 'lucide-react';
import {Separator} from '../ui/separator';
import {Card, CardContent, CardFooter, CardHeader} from '../ui/card';
import CommentEditor from './commentEditor';
import {deleteComment, updateComment} from '../../store/actions/postActions';
import {formatTextCleanlyPreservingMedia, readTime} from '../../utils';

const Comment = (props) => {
  const dispatch = useDispatch();
  const { username, createdAt, userPhoto, postId, address, contentHtml, userId, id: commentId, onCommentUpdate  } = props;
  const [updateContentHtml, setUpdateContentHtml] = useState(contentHtml);
  const [isEditing, setIsEditing] = useState(false);
  const [editorInstance, setEditorInstance] = useState(null);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const popupOpen = Boolean(anchorEl);
  const popup_id = popupOpen ? 'simple-popover' : undefined;
  const [_previewImage, setPreviewImage] = useState(null);

  const saveEditedComment = () => {
    if (!commentId || !postId || !editorInstance) return;
    const editedHtml = editorInstance.root.innerHTML.trim();
    if (!editedHtml || editedHtml === '<p><br></p>') {
      return;
    }
    dispatch(updateComment(postId, commentId, editedHtml)).then((res) => {
        if (res) {
          const updated = { ...props, contentHtml: editedHtml };
          setUpdateContentHtml(editedHtml);
          setIsEditing(false);
          setAnchorEl(null);
          if (typeof onCommentUpdate === 'function') {
            onCommentUpdate(updated);
          }
        }
      }).catch((err) => {
        console.error('Failed to save edited comment:', err);
      })
  };

  const handleDeleteComment = () => {
    if (!commentId || !postId) return;
    dispatch(deleteComment(postId, commentId))
      .then((res) => {
        if (res && typeof props.onCommentDelete === 'function') {
          props.onCommentDelete(commentId);
          setAnchorEl(null);
        }
      }).catch((err) => {
        console.error('Failed to delete comment:', err);
      });
  };

  useEffect(() => {
    const container = document.getElementById(`comment_${commentId}`);
    if (!container) return;

    const bindImageClicks = () => {
      const images = container.querySelectorAll('img');
      images.forEach((img) => {
        img.style.cursor = 'pointer';
        img.onclick = (e) => {
          e.stopPropagation();
          setPreviewImage(img.src);
        };
      });
    };

    bindImageClicks();
    const observer = new MutationObserver(bindImageClicks);
    observer.observe(container, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [commentId]);
  
  useEffect(() => {
    if (isEditing && editorInstance) {
      setTimeout(() => {
        editorInstance.focus();
      }, 100);
    }
  }, [isEditing, editorInstance]);
  
  // useEffect(() => {
  //   if (!showReplies || !id) return;
  //   const q = query(collection(db, 'posts', postId, 'comments', id, 'replies'), orderBy('createdAt', 'asc'));
  //   const unsubscribe = onSnapshot(q, (snapshot) => {
  //     const replyList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  //     setReplies(replyList);
  //   });
  //   return () => unsubscribe();
  // }, [showReplies, id, commentId]);

  return (
    <>
      <Card className="w-full overflow-hidden mx-auto border-0 shadow-none bg-white pt-1">
        <CardHeader className="p-0">
          <div className="flex items-start justify-between w-full">
            <div className="flex items-center gap-0">
              <Avatar src={userPhoto} sx={{ width: 25, height: 25 }} />
              <div className="text-[15px] text-[#181818] ml-3">{username}</div>
              <div className="text-sm text-[#707070] ml-3">{readTime(createdAt ? createdAt: new Date(Date.now()))}</div>
            </div>
            {userId === getAuth().currentUser?.uid && (
              <>
                <MoreHorizontalIcon
                  className="text-gray-500 cursor-pointer"
                  onClick={(e) => setAnchorEl(e.currentTarget)}
                />
                <Popover
                  id={popup_id}
                  open={Boolean(anchorEl)}
                  anchorEl={anchorEl}
                  onClose={() => setAnchorEl(null)}
                  anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  disableScrollLock
                >
                  <div className="p-2 space-y-2 w-35">
                    <div
                      className="cursor-pointer text-sm flex items-center justify-between hover:bg-gray-100 px-2 py-1 rounded"
                       onClick={() => {
                        setIsEditing(true)
                        setAnchorEl(null)
                      }}
                    >
                      <span className="text-base">Edit</span>
                      <Pencil className="w-5 h-5" />
                    </div>
                    <div
                      onClick={handleDeleteComment}
                      className="cursor-pointer text-sm flex items-center justify-between hover:bg-gray-100 px-2 py-1 rounded text-red-600"
                    >
                      <span className="text-base">Delete</span>
                      <Trash className="w-5 h-5" />
                    </div>
                  </div>
                </Popover>
              </>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0 px-[5px] mt-[10px]">
          {address && <div className="text-[#787878] text-[14px] py-1">{address}</div>}

          <div id={`comment_${commentId}`}>
            {isEditing ? (
              <>  
               <div className="create-post">
                  <div className="w-full px-1 py-1">
                    <CommentEditor
                      onReady={setEditorInstance}
                      placeholder="Edit comment..."
                      defaultValue={contentHtml}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pr-[10px]">
                  <Save
                    className="w-5 h-5 cursor-pointer hover:text-blue-500 transition-colors duration-200"
                    onClick={saveEditedComment}
                  />
                  <CircleX
                    className="w-5 h-5 cursor-pointer hover:text-red-500 transition-colors duration-200"
                    onClick={() => setIsEditing(false)}
                  />
                </div>
              </>
            ) : (
              <div
                onClick={(e) => e.target.tagName.toLowerCase() !== 'img'}
                className="cursor-pointer w-full post-content px-2"
                dangerouslySetInnerHTML={{
                  __html: formatTextCleanlyPreservingMedia(updateContentHtml)
                }}
              />
            )}
          </div>
        </CardContent>

        <CardFooter className="p-0" />
      </Card>

      <div className="px-1 py-0 pb-1 w-full mt-2">
        <Separator className="bg-[#E9E5DF]" />
      </div>
    </>
  );
};

export default Comment;
