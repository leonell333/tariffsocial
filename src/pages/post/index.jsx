import { useState, useEffect, useRef, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useLocation } from 'react-router-dom'
import { updateBaseStore } from '../../store/actions/baseActions'
import { getPosts, getSponsored, getBannerAds, getHashTags, getPostAndSponsored, listenForNewPosts, updatePostStore, searchPostsByKeywords } from '../../store/actions/postActions'
import CreatePost from '../../components/post/create'
import Post from '../../components/post/post'
import AdsSlick from '../../components/advertise/adsSlick'
import Sponsored from '../../components/advertise/viewSponsored'
import PostSortBar from './postSortBar'

const SPONSORED_INSERT_INTERVAL = 4

const Posts = () => {
  const { pathname } = useLocation()
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const { keyword, hashtags, posts, sponsored, bannerAds, lastPostVisible, lastSponsoredVisible, searchPosts, isSearchMode, lastSearchPostVisible } = useSelector((state) => state.post);
  // console.log('sponsored',sponsored);
  // console.log('bannerAds',bannerAds);
  // console.log('posts', posts);
  
  const postRef = useRef(null)
  const lastScrollY = useRef(0);
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [layoutWidth, setLayoutWidth] = useState(1320)
  const [isGeting, setIsGeting] = useState(false)

  useEffect(() => {
    dispatch(listenForNewPosts()).then((res) => {
    }).catch((err) => {
      console.error('Failed to listen for new posts:', err);
    });
  }, [user.authenticated]);

  useEffect(() => {
    updatePostStore({
      posts: [],
      lastPost: null,
      lastPostVisible: false,
      sponsored: [],
      lastSponsored: null,
      lastSponsoredVisible : false,
    })
    initData()
  }, [])

  useEffect(() => {
    const updateLayout = () => {
      if (postRef.current) {
        const rect = postRef.current.getBoundingClientRect();
        setLayoutWidth(rect.width);
      }
    };
    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, [layoutWidth]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollableContainer = document.querySelector('.main-content-scrollable');
      if (!scrollableContainer) return;
      const scrollTop = scrollableContainer.scrollTop;
      const isScrollingDown = scrollTop > lastScrollY.current;
      const containerHeight = scrollableContainer.clientHeight;
      const scrollHeight = scrollableContainer.scrollHeight;
      const threshold = 50; 
      const isNearBottom = containerHeight + scrollTop >= scrollHeight - threshold;
      const scrollPercentage = (scrollTop + containerHeight) / scrollHeight;
      const isNearBottomByPercentage = scrollPercentage >= 0.8;
      if (
        isScrollingDown &&
        isNearBottom &&
        !isGeting
      ) {
        setIsGeting(true);
        if (isSearchMode) {
          dispatch(searchPostsByKeywords(keyword, false)).then((res) => {
            setIsGeting(false);
          }).catch((err) => {
            console.error('Failed to get more search results:', err);
            setIsGeting(false);
          });
        } else {
          dispatch(getPostAndSponsored()).then((res) => {
            setIsGeting(false);
          }).catch((err) => {
            console.error('Failed to get posts/sponsored:', err);
            setIsGeting(false);
          });
        }
      }

      lastScrollY.current = scrollTop;
    };

    const scrollableContainer = document.querySelector('.main-content-scrollable');
    if (scrollableContainer) {
      scrollableContainer.addEventListener('scroll', handleScroll);
      return () => scrollableContainer.removeEventListener('scroll', handleScroll);
    }
  }, [isGeting, isSearchMode, keyword]);

  const mergeSponsoredWithPosts = (posts, sponsored) => {
    const result = []
    let postIndex = 0
    let sponsoredIndex = 0

    while (postIndex < posts.length || sponsoredIndex < sponsored.length) {
      for (let i = 0; i < SPONSORED_INSERT_INTERVAL && postIndex < posts.length; i++) {
        result.push(posts[postIndex++])
      }
      if (sponsoredIndex < sponsored.length) {
        result.push(sponsored[sponsoredIndex++])
      }
    }
    return result
  }

  const initData = async () => {
    try {
      const promises = [];
      if (hashtags.length === 0) {
        promises.push(dispatch(getHashTags()));
      }
      if (posts.length === 0 && !lastPostVisible && !isSearchMode) {
        promises.push(dispatch(getPosts()));
      }
      if (sponsored.length === 0 && !lastSponsoredVisible && !isSearchMode) {
        promises.push(dispatch(getSponsored()));
      }
      if (bannerAds.length === 0) {
        promises.push(dispatch(getBannerAds()));
      }
      if (promises.length > 0) {
        dispatch(updateBaseStore({ loading: true }))
        const t0 = performance.now();
        await Promise.all(promises);
        const t1 = performance.now();
        console.log('init data:', ((t1 - t0) / 1000).toFixed(2), 's');
      } else {
        return
      }
    } catch (err) {
      console.error('Error fetching initial data:', err);
    } finally {
      dispatch(updateBaseStore({ loading: false }))
    }
  };
  return (
    <>
      <div className="" ref={postRef}>
        {user.authenticated && (
          <div className={`${
            showCreatePost ? `fixed z-40 top-[121px] bg-[#ECECEC] pb-1`: ''
          }`}>
            <div 
              className={`px-4 bg-white border border-[#EBEBEB] rounded-xl ${
                showCreatePost ? `m-0 py-0`: 'mb-3 py-1'
              } create-post`}
              style={{
                width: `${layoutWidth}px`
              }}  
            >
              <div className="flex-grow mt-[12px]">
                <CreatePost />
              </div>
            </div>
          </div>
        )}

        <PostSortBar
          layoutWidth={layoutWidth}
          showCreatePost={showCreatePost}
          setShowCreatePost={setShowCreatePost}
        />
        
        <div className={`rounded-[4px] ${!user.authenticated ? 'mt-[35px]' : ''}`}>
          {bannerAds.length > 0 && !isSearchMode && <AdsSlick ads={bannerAds} />}

          <div className = "mt-2">
            {isSearchMode ? (
              // Display search results
              <>
                {searchPosts.length > 0 ? (
                  searchPosts.map((item) => (
                    <Post key={item.id} post={item} />
                  ))
                ) : (
                  <div className="text-center py-2 text-gray-500">
                    <p>No posts found matching your search.</p>
                    <p className="text-sm mt-2">Try different keywords or check your spelling.</p>
                  </div>
                )}
                {isGeting && (
                  <div className="text-center py-4">
                    <p className="text-gray-500">Loading more results...</p>
                  </div>
                )}
              </>
            ) : (
              mergeSponsoredWithPosts(posts, sponsored).map((item, index) =>
                item.type === 'post' ? (
                  <Post key={item.id} post={item} />
                ) : (
                  <Sponsored key={item.id} sponsored={item} />
                )
              )
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default Posts;