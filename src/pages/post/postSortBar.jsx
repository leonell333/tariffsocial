import { useState, useEffect, useRef, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { TrendingIcon } from '../../components/ui/icons'
import { Plus } from 'lucide-react'
import { updatePostStore, getPosts } from '../../store/actions/postActions'
import { updateBaseStore } from '../../store/actions/baseActions'

const PostSortBar = (props) => {
  const postSortRef = useRef(null);
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const [isSticky, setIsSticky] = useState(false)
  const [sortBarOffset, setSortBarOffset] = useState(0);
  const { layoutWidth, showCreatePost, setShowCreatePost } = props
  const { sort, hashtags, selectedTags, myPosts, isSearchMode, keyword } = useSelector((state) => state.post)

  useEffect(() => {
    if (isSearchMode) return;
    
    try {
      dispatch(updateBaseStore({ loading: true }))
      dispatch(getPosts())
        .then((res) => {
          dispatch(updateBaseStore({ loading: false }));
        }).catch((err) => {
          dispatch(updateBaseStore({ loading: false }));
          console.error('Error inside then/catch:', err);
        });
    } catch (err) {
      console.error('Synchronous error:', err);
    }
  }, [sort, hashtags, selectedTags, myPosts, isSearchMode])

  const toggleTag = (tag) => {
    if (isSearchMode) {
      dispatch(updatePostStore({ 
        isSearchMode: false,
        searchPosts: [],
        lastSearchPost: null,
        lastSearchPostVisible: false,
        keyword: []
      }));
    }
    
    const updatedTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    dispatch(updatePostStore({ selectedTags: updatedTags, lastPost: null, posts: [] }));
  };

  const setSort = (newSort) => {
    if (isSearchMode) {
      dispatch(updatePostStore({ 
        isSearchMode: false,
        searchPosts: [],
        lastSearchPost: null,
        lastSearchPostVisible: false,
        keyword: []
      }));
    }
    
    dispatch(updatePostStore({ sort: newSort, lastPost: null, posts: [] }));
  };

  useEffect(() => {
    const updateOffsetTop = () => {
      if (postSortRef.current) {
        setSortBarOffset(postSortRef.current.offsetTop);
      }
    };
    updateOffsetTop();
    window.addEventListener('resize', updateOffsetTop);
    const resizeObserver = new ResizeObserver(() => updateOffsetTop());
    const mutationObserver = new MutationObserver(() => updateOffsetTop());
    if (postSortRef.current) {
      resizeObserver.observe(postSortRef.current);
      mutationObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }

    return () => {
      window.removeEventListener('resize', updateOffsetTop);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollableContainer = document.querySelector('.main-content-scrollable');
      if (!scrollableContainer) return;
      const scrollTop = scrollableContainer.scrollTop;
      if (!user?.authenticated) {
        setIsSticky(true);
        return;
      }
      setIsSticky(scrollTop >= sortBarOffset - 16);
      if (scrollTop <= sortBarOffset - 16) setShowCreatePost(false);
    };

    const scrollableContainer = document.querySelector('.main-content-scrollable');
    if (scrollableContainer) {
      scrollableContainer.addEventListener('scroll', handleScroll);
      return () => scrollableContainer.removeEventListener('scroll', handleScroll);
    }
  }, [sortBarOffset, user?.authenticated]);

  return (
    <div ref={postSortRef}
      className={`w-full px-2 sm:px-4 z-30 sort-var ${
        (!user?.authenticated || isSticky) ? `fixed top-[72px] pt-[16px] pb-[2px] bg-[#ECECEC]`: ''
      }`}
      style={{ 
        width: `${layoutWidth}px`,
      }}
    >
      <div className="w-full flex justify-between items-center flex-wrap gap-1 mb-2">
        <span
          className={`flex items-center cursor-pointer ${
            sort === 'trending' ? 'bg-blue-100 text-blue-500 rounded-full' : ''
          }`}
          onClick={() => setSort(sort === 'trending' ? 'recent' : 'trending')}
        >
          <TrendingIcon />
        </span>

        {hashtags.slice(0, 
          isSticky ? (user.authenticated ? 3 : 5) : (user.authenticated ? 4 : 5)
        ).map((item, index) => {
          const isSelected = selectedTags.includes(item.tag)
          return (
            <button
              key={index}
              className={`py-0.4 px-3 border rounded text-[14px] font-medium cursor-pointer ${
                isSelected
                  ? 'border-gray-300 bg-gray-300 text-gray-700'
                  : 'bg-white border-gray-300 text-[#333] hover:bg-gray-100'
              }`}
              onClick={() => toggleTag(item.tag)}
            >
              #{item.tag}
            </button>
          )
        })}

        {user.authenticated && (
          <button
            className={`py-0.4 px-3 mr-3 border rounded text-[14px] font-medium cursor-pointer ${
              myPosts
                ? 'border-gray-300 bg-gray-300 text-gray-700'
                : 'bg-white border-gray-300 text-[#333] hover:bg-gray-100'
            }`}
            onClick={() => { 
              if (isSearchMode) {
                dispatch(updatePostStore({ 
                  isSearchMode: false,
                  searchPosts: [],
                  lastSearchPost: null,
                  lastSearchPostVisible: false,
                  keyword: []
                }));
              }
              dispatch(updatePostStore({ myPosts: !myPosts, selectedTags: [], keyword: '', posts: [], lastPost: null })); 
            }}
          >
            My posts
          </button>
        )}

        <div className="flex items-center justify-end">
          <Select value={sort} onValueChange={setSort} >
            <SelectTrigger className="border-none shadow-none p-0 h-auto w-auto bg-transparent focus:outline-none">
              <SelectValue>
                <span className="text-sm text-[#161722] font-semibold capitalize">{sort}</span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-white border-none shadow-none outline-none disableScrollLock" side="bottom" align="start" alignOffset={-60} avoidCollisions={false}>
              {['popular', 'recent', 'trending'].map((option) => (
                <SelectItem key={option} value={option} className="hover:bg-gray-100 text-sm capitalize cursor-pointer">
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isSticky && user?.authenticated && (
          <button
            type="button"
            onClick={() => setShowCreatePost(!showCreatePost)}
            style={{ fontFamily: 'Poppins' }}
            className="flex items-center px-2.5 py-0.4 border rounded text-[14px] bg-[#1976d2] text-white cursor-pointer"
          >
            {!showCreatePost ? (
              <>
                <Plus size={14} />
                <span>Post</span>
              </>
            ) : (
              <span>Close</span>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

export default PostSortBar;