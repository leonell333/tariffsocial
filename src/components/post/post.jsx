import React, {useEffect, useState} from 'react'
import {useDispatch, useSelector} from 'react-redux'
import {useNavigate} from 'react-router'
import {db,} from '../../firebase'
import {doc, getDoc,} from 'firebase/firestore'
import {getAuth} from "firebase/auth";
import {Card, CardContent, CardFooter, CardHeader} from '../ui/card'
import {
  BlockIcon,
  CancelBlockIcon,
  CancelSaveIcon,
  ComplainIcon,
  CopyLinkIcon,
  InterestedIcon,
  NotInterestedIcon,
  RepostIcon,
  SaveIcon,
  ShareIcon
} from '../ui/icons'
import {Separator} from '../ui/separator'
import {Avatar, Popover,} from '@mui/material'
import {CircleX, Heart, MessageCircle, MoreHorizontalIcon, Pencil, Save, Trash,} from 'lucide-react'
import CreateComment from './createComment'
import Comment from './comment'
// import PostEditor from './postEditor'
import BlockModal from './blockModal'
import ReportModal from './reportModal'
import ImagePreviewModal from './imagePreviewModal'
import {
  deletePost,
  getPostComments,
  searchPostsByKeywords,
  updatePost, updatePostStore,
  updateRecommendation
} from '../../store/actions/postActions'
import {formatTextCleanlyPreservingMedia, getFormattedContent, readTime} from '../../utils';
import {getUserDataById} from '../../store/actions/userActions';

const PostEditor = React.lazy(() => import('./postEditor'))

const Post = (props) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const isAdmin = useSelector((state) => state.user.role?.admin);
  const { id, username, useremail, userPhoto, ownerId, createdAt, address, tags = [], likesCount,
    lovesCount, laughsCount, commentsCount, repostsCount, reportsCount, savesCount, sharesCount } = props.post;
  const [contentHtml, setContentHtml] = useState(props.post.contentHtml || '');
  const formattedContent = formatTextCleanlyPreservingMedia(contentHtml || '');
  const [showComments, setShowComments] = useState(false)
  const [blockModalShow, setBlockModalShow] = useState(false)
  const [reportModalShow, setReportModalShow] = useState(false)
  const [isEditing, setIsEditing] = useState(false);
  const [editorInstance, setEditorInstance] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null)
  const [expand, setExpand] = useState(false)
  const [previewImage, setPreviewImage] = useState(null);
  const [updateComments, setUpdateComments] = useState({ 
    comments: [], lastComment: null, lastCommentVisible: false
  })

  const [recommendations, setRecommendations] = useState({
    id,
    ownerId,
    likesCount,
    lovesCount,
    laughsCount,
    commentsCount,
    repostsCount,
    savesCount,
    sharesCount,
  });

  const [userInteractions, setUserInteractions] = useState({
    save: false,
    like: false,
    love: false,
    repost: false,
    report: false,
  });

  const handleUpdateRecommendations = async (type, data = {}) => {
    try {
      const result = await dispatch(updateRecommendation(recommendations, { type, ...data }));
      if (result?.success) {
        const delta = result.action === 'remove' ? -1 : 1;
        setRecommendations(prev => ({
          ...prev,
          [`${type}sCount`]: (prev[`${type}sCount`] || 0) + delta
        }));
        setUserInteractions(prev => ({
          ...prev,
          [type]: result.action !== 'remove'
        }));
      } else {
        console.error('Unexpected update result:', result);
      }
    } catch (error) {
      console.error('Failed to update post data:', error);
    }
  };

  const handleSaveEditedPost = async () => {
    if (!id || !editorInstance) return;
    try {
      const result = await dispatch(updatePost({ id, editorInstance, tags, address }));
      if (result) {
        setContentHtml(result.contentHtml);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error while saving post edits:', error);
    }
  };

  const handleDeletePost = async () => {
    if (!id) return;
    try {
      const result = await dispatch(deletePost({id, ownerId}));
      if (result) {
        setAnchorEl(null)
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    const getInteractions = async () => {
      const postId = id;
      const userId = user.id;
      const interactionDocRef = doc(db, 'posts', postId, 'interactions', userId);
      const interactionSnap = await getDoc(interactionDocRef);
      if (interactionSnap.exists()) {
        const data = interactionSnap.data();
        setUserInteractions({
          save: !!data.save,
          like: !!data.like,
          love: !!data.love,
          repost: !!data.repost,
          report: !!data.report,
        });
      }
    };
    getInteractions();
  }, [user?.id,]);

  const handleToggleComments = () => {
    setShowComments(!showComments);
    if (!showComments && commentsCount !== 0) {
      dispatch(getPostComments(id, updateComments)).then((newComments) => {
        if (Array.isArray(newComments) && newComments.length > 0) {
          setUpdateComments(prev => ({
            ...prev,
            comments: [...prev.comments, ...newComments],
            lastComment: newComments[newComments.length - 1],
            lastCommentVisible: newComments.length < 5,
          }));
        } else {
          setUpdateComments(prev => ({
            ...prev,
            lastCommentVisible: true,
          }));
        }
      }).catch(err => {
        console.error('Comment load error:', err);
      });
    }
  };

  const handleLoadMoreComments = async () => {
    try {
      const newComments = await dispatch(getPostComments(id, updateComments));
      if (Array.isArray(newComments) && newComments.length > 0) {
        setUpdateComments(prev => ({
          ...prev,
          comments: [...prev.comments, ...newComments],
          lastComment: newComments[newComments.length - 1],
          lastCommentVisible: newComments.length < 5,
        }));
      } else {
        setUpdateComments(prev => ({
          ...prev,
          lastCommentVisible: true,
        }));
      }
    } catch (err) {
      console.error('Comment load error:', err);
    }
  };

  const handleAvatarClick = (userId) => {
    if (!user.authenticated) return
    dispatch(getUserDataById(userId)).then((res) => {
      if (res) {
        navigate('/profile/' + userId);
      }
    }).catch((err) => {
      console.log('err',err);
    }).finally(() => {
    })
  }

  useEffect(() => {
    const container = document.getElementById(`content_${id}`);
    if (!container) return;
    const bindInteractions = () => {
      const images = container.querySelectorAll('img');
      images.forEach((img) => {
        img.style.cursor = 'pointer';
        img.onclick = (e) => {
          e.stopPropagation();
          if (!expand) {
            setExpand(true);
          } else {
            setPreviewImage(img.src);
          }
        };
      });

      const videos = container.querySelectorAll('video');
      videos.forEach((video) => {
        video.setAttribute('muted', 'true');
        video.setAttribute('playsinline', 'true');
        video.setAttribute('controls', 'true');
        video.classList.add('w-full', 'max-h-[500px]', 'rounded-lg', 'object-cover');
        video.onclick = (e) => {
          e.stopPropagation();
          if (!expand) {
            setExpand(true);
          } else {
            video.requestFullscreen?.();
          }
        };
      });
    };

    bindInteractions();

    const observer = new MutationObserver(() => {
      bindInteractions();
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [id, contentHtml, expand]);

  useEffect(() => {
    if (isEditing && editorInstance && contentHtml) {
      editorInstance.root.innerHTML = contentHtml;
    }
  }, [isEditing]);

  const handleSelectTag = (tag) => {
    // Navigate to home page and search for the tag
    navigate('/');
    setTimeout(() => {
      dispatch(updatePostStore({ 
        keyword: [tag],
        isSearchMode: true,
        searchPosts: [],
        lastSearchPost: null,
        lastSearchPostVisible: false
      }));
      // Trigger the search
      dispatch(searchPostsByKeywords([tag], true));
    }, 100);
  };

  return (
    <>
      <Card className="w-full rounded-[10px] overflow-hidden mx-auto  border border-[#EBEBEB] shadow-none post-card p-4 mb-2 bg-white">
        <CardHeader className="p-0">
          <div className="flex items-start justify-between w-full">
            <div className="flex items-center gap-0">
              <Avatar
                src={userPhoto}
                sx={{ width: 40, height: 40 }}
                className="cursor-pointer"
                onClick={() => { handleAvatarClick(ownerId) }}
              />
              <div className="text-xl text-[#181818] ml-4">
                {username}
              </div>
              <div className="text-xs text-[#707070] ml-3 pt-1">
                {readTime(createdAt ? createdAt: new Date(Date.now()))}
              </div>
            </div>

            <MoreHorizontalIcon
              className="text-gray-500 cursor-pointer"
              onClick={(event) => setAnchorEl(event.currentTarget)}
            />
            <Popover
              className="post-card-popup"
              open={Boolean(anchorEl)}
              anchorEl={anchorEl}
              onClose={() => setAnchorEl(null)}
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              disableScrollLock
            >
              <div className='py-2'>
                {ownerId !== getAuth().currentUser?.uid && (
                  <>
                    {/* Save */}
                    <div
                      className="w-[155px] mx-5 mt-[5px] cursor-pointer h-7 hover:text-blue-600"
                      onClick={() => {
                        handleUpdateRecommendations('save')
                        setAnchorEl(null)
                      }}
                    >
                      {userInteractions.save ? (
                        <>
                          <div className="float-left text-base">Cancel Save</div>
                          <CancelSaveIcon />
                        </>
                      ) : (
                        <>
                          <div className="float-left text-base">Save</div>
                          <SaveIcon />
                        </>
                      )}
                    </div>

                    {/* Like */}
                    <div
                      className="w-[155px] mx-5 mt-[5px] cursor-pointer h-7 hover:text-blue-600"
                      onClick={() => {
                        handleUpdateRecommendations('like')
                        setAnchorEl(null)
                      }}
                    >
                      {userInteractions.liked ? (
                        <>
                          <div className="float-left text-base">Not Interested</div>
                          <NotInterestedIcon />
                        </>
                      ) : (
                        <>
                          <div className="float-left text-base">Interested</div>
                          <InterestedIcon />
                        </>
                      )}
                    </div>

                    {/* Block */}
                    <div
                      className="w-[155px] mx-5 mt-[5px] cursor-pointer h-7 hover:text-blue-600"
                      onClick={() => {
                        if (
                          user.authenticated &&
                          (!user.blocks || !user.blocks.includes(ownerId))
                        ) {
                          setBlockModalShow(true)
                        } else {
                          handleUpdateRecommendations('block')
                          setAnchorEl(null)
                        }
                      }}
                    >
                      {user.authenticated &&
                      user.blocks &&
                      user.blocks.includes(ownerId) ? (
                        <>
                          <div className="float-left text-base text-[#FF0000]">Cancel Block</div>
                          <CancelBlockIcon />
                        </>
                      ) : (
                        <>
                          <div className="float-left text-base text-[#FF0000]">Block</div>
                          <BlockIcon />
                        </>
                      )}
                    </div>

                    {/* Complain */}
                    {!userInteractions.reported && (
                      <div
                        className="w-[155px] mx-5 mt-[5px] cursor-pointer h-7 hover:text-blue-600"
                        onClick={() => {
                          setReportModalShow(true)
                        }}
                      >
                        <div className="float-left text-base text-[#FF0000]">Complain</div>
                        <ComplainIcon />
                      </div>
                    )}

                    {/* Copy Link */}
                    <div
                      className="w-[155px] mx-5 mt-[5px] cursor-pointer h-7 hover:text-blue-600"
                      onClick={() => {
                        handleUpdateRecommendations('share')
                        setAnchorEl(null)
                      }}
                    >
                      <div className="float-left text-base">Copy link to Post</div>
                      <CopyLinkIcon />
                    </div>
                  </>
                )}

                {(ownerId === getAuth().currentUser?.uid || isAdmin) && (
                  <>
                    {/* Edit */}
                    <div
                      className="w-[155px] mx-5 mt-[5px] cursor-pointer h-7 hover:text-blue-600"
                      onClick={() => {
                        setIsEditing(true)
                        setAnchorEl(null)
                      }}
                    >
                      <div className="float-left text-base">Edit Post</div>
                      <Pencil size={20} className="float-right" />
                    </div>

                    {/* Delete */}
                    <div
                      className="w-[155px] mx-5 mt-[5px] cursor-pointer h-7 hover:text-blue-600"
                      onClick={() => {
                        handleDeletePost()
                      }}
                    >
                      <div className="float-left text-base">Delete Post</div>
                      <Trash size={20} className="float-right" />
                    </div>
                  </>
                )}
              </div>
            </Popover>
          </div>
        </CardHeader>

        <CardContent className="p-0 px-[5px] mt-[10px]">
          {/* {address && (
            <div className="text-[#787878] text-[14px]  py-1">
              {address}
            </div>
          )} */}

          <div className={`cursor-pointer pr-2 pl-3 transition-all duration-300`} >
            <div id={`content_${id}`}>
              {isEditing ? (
                <div className="create-post">
                  <div className="w-full post-content">
                    <PostEditor
                      onReady={setEditorInstance}
                      placeholder="Edit your post..."
                      initialContent={contentHtml}
                    />
                  </div>
                  <div className="flex justify-end gap-3 mt-1 pr-2">
                    <Save
                      className="w-5 h-5 cursor-pointer hover:text-blue-500"
                      onClick={handleSaveEditedPost}
                    />
                    <CircleX
                      className="w-5 h-5 cursor-pointer hover:text-red-500"
                      onClick={() => setIsEditing(false)}
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="cursor-pointer post-content"
                    onClick={(e) => { setExpand(!expand) }}
                    dangerouslySetInnerHTML={{
                      __html: expand ? formattedContent : getFormattedContent(contentHtml)
                    }}
                  />
                  {Array.isArray(tags) && tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-0">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[16px] pl-1 py-1 rounded flex items-center gap-1 group">
                          <a
                            className="cursor-pointer flex gap-0"
                            onClick={() => handleSelectTag(tag)}
                          >
                            <span className="text-[#0055ff] group-hover:text-blue-800 transition-colors">#</span>
                            <span className="text-black group-hover:text-blue-800 transition-colors">{tag}</span>
                          </a>
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col p-0 mt-1">
          <div className="flex items-center gap-6 px-2.5 py-0 w-full">
            {/* Love */}
            <div
              className={`flex items-center gap-1 transition-all duration-200 group ${
                ownerId === user.id
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-pointer hover:opacity-80'
              }`}
              onClick={() => {
                if (ownerId !== user.id) {
                  handleUpdateRecommendations('love', { userInteractions });
                }
              }}
            >
              <Heart
                className={`w-5 h-5 transition-all duration-200 ${
                  userInteractions.love
                    ? 'fill-current text-red-500'
                    : 'text-black group-hover:text-red-500 group-hover:scale-110'
                }`}
              />
              <span className="text-base font-medium text-black">
                {recommendations.lovesCount}
              </span>
            </div>

            {/* Comment */}
            <div
              className="flex items-center gap-1 cursor-pointer group transition-all duration-200"
              onClick={handleToggleComments}
            >
              <MessageCircle
                className="w-5 h-5 text-black transition-all duration-200 group-hover:text-blue-600"
              />
              <span className="text-sm text-black">
                {recommendations.commentsCount}
              </span>
            </div>

            {/* Repost */}
            <div
              className={`flex items-center gap-1 ${
                ownerId === user.id || userInteractions.repost
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-pointer hover:opacity-80'
              }`}
              onClick={() => {
                if (ownerId !== user.id && !userInteractions.repost) {
                  handleUpdateRecommendations('repost', {
                    // time: serverTime,
                    time: 2000,
                    userInteractions,
                    contentHtml
                  });
                }
              }}
            >
              <RepostIcon
                className={
                  userInteractions.repost ? 'text-green-500' : 'text-gray-500'
                }
              />
              <span className="text-sm">{recommendations.repostsCount}</span>
            </div>

            {/* Share */}
            <div
              className="flex items-center gap-1 cursor-pointer hover:opacity-80"
              onClick={() =>
                handleUpdateRecommendations('share', { userInteractions })
              }
            >
              <ShareIcon className="text-gray-500" />
              <span className="text-sm">{recommendations.shares}</span>
            </div>
          </div>
        </CardFooter>

        {showComments && (
          <>
            <div className="px-1 py-0 w-full mt-2">
              <Separator className="bg-[#E9E5DF]" />
            </div>

            <div className="pl-5 py-2">
              {Array.isArray(updateComments.comments) && updateComments.comments.length > 0 ? (
                updateComments.comments.map((item, index) => (
                  (item.postId === id ) && <Comment key={item.id}
                    {...item} expand={expand} postId={id} 
                    onCommentUpdate={(updatedComment) => {
                      setUpdateComments((prev) => {
                        const updatedComments = prev.comments.map((comment) =>
                          comment.id === updatedComment.id ? updatedComment : comment
                        );
                        const lastComment = updatedComments[updatedComments.length - 1] || null;
                        return {
                          ...prev,
                          comments: updatedComments,
                          lastComment,
                        };
                      });
                    }}
                    onCommentDelete={(commentId) => {
                      setUpdateComments((prev) => {
                        const filtered = prev.comments.filter((c) => c.id !== commentId);
                        const lastComment = filtered[filtered.length - 1] || null;
                        return {
                          ...prev,
                          comments: filtered,
                          lastComment,
                        };
                      });

                      setRecommendations((prev) => ({
                        ...prev,
                        commentsCount: Math.max(0, (prev.commentsCount || 1) - 1),
                      }));
                    }} />
                ))
              ) : (
                <p className="text-gray-500 mb-4">
                  No feedback yet. Be the first to comment!
                </p>
              )}
              
              {!updateComments.lastCommentVisible && (
                <div
                  className="flex justify-center cursor-pointer hover:opacity-80 mt-2 ml-1"
                  onClick={handleLoadMoreComments}
                >
                  <MoreHorizontalIcon className="w-5 h-5 text-blue-600" />
                </div>
              )}

              {user.authenticated && <CreateComment postId={id}
                setRecommendations={setRecommendations}
                setUpdateComments={setUpdateComments} />}
            </div>
          </>
        )}
      </Card>

      {blockModalShow && (
        <BlockModal
          open={blockModalShow}
          onClose={() => setBlockModalShow(false)}
          username={username}
          onBlock={() => {
            handleUpdateRecommendations('block').then(() => {
              setBlockModalShow(false)
              setAnchorEl(null)
            })
          }}
        />
      )}

      {reportModalShow && (
        <ReportModal
          open={reportModalShow}
          onClose={() => setReportModalShow(false)}
          onSelectOption={(option) => {
            handleUpdateRecommendations('report', { option }).then(() => {
              setReportModalShow(false)
              setAnchorEl(null)
            })
          }}
        />
      )}

      <ImagePreviewModal src={previewImage} onClose={() => setPreviewImage(null)}  />
    </>
  )
}

export default Post;