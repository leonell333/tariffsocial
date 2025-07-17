import {UPDATE_POST_STORE} from '../types';
import {analytics, db, storage} from "../../firebase"
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  getDocsFromCache,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
  writeBatch
} from "firebase/firestore";
import {getDownloadURL, ref as storageRef, uploadBytesResumable} from 'firebase/storage'
import {updateUserStore} from './userActions';
import {updateBaseStore} from './baseActions';
import {extractKeywords} from '../../utils';
import {logEvent} from 'firebase/analytics';

const keywordCache = new Map();
const memoizedExtractKeywords = (contentHtml, tags, address) => {
  const cacheKey = `${contentHtml.slice(0, 100)}-${tags.join(',')}-${address}`;
  if (keywordCache.has(cacheKey)) {
    return keywordCache.get(cacheKey);
  }
  const keywords = extractKeywords(contentHtml, tags, address);
  keywordCache.set(cacheKey, keywords);
  if (keywordCache.size > 1000) {
    const firstKey = keywordCache.keys().next().value;
    keywordCache.delete(firstKey);
  }
  return keywords;
};

const batchQueue = new Map();
const BATCH_DELAY = 100; // ms
const MAX_BATCH_SIZE = 500;

const optimizedBatchWrite = (batchId, operation) => {
  if (!batchQueue.has(batchId)) {
    batchQueue.set(batchId, []);
    setTimeout(() => {
      const operations = batchQueue.get(batchId);
      if (operations && operations.length > 0) {
        executeBatchOperations(operations);
        batchQueue.delete(batchId);
      }
    }, BATCH_DELAY);
  }

  const queue = batchQueue.get(batchId);
  queue.push(operation);

  if (queue.length >= MAX_BATCH_SIZE) {
    executeBatchOperations(queue);
    batchQueue.delete(batchId);
  }
};

const executeBatchOperations = async (operations) => {
  const batch = writeBatch(db);
  operations.forEach(op => op(batch));
  try {
    await batch.commit();
  } catch (error) {
    console.error('Batch operation failed:', error);
  }
};

const optimizedUploadMedia = async (elements, folder, userId, onProgress) => {
  const CONCURRENT_UPLOADS = 3;
  const tasks = Array.from(elements);
  const results = [];

  let total = tasks.length;
  let completed = 0;

  for (let i = 0; i < tasks.length; i += CONCURRENT_UPLOADS) {
    const batch = tasks.slice(i, i + CONCURRENT_UPLOADS);
    const batchResults = await Promise.allSettled(
      batch.map(async (el, index) => {
        if (el.src.startsWith('https://')) return null;
        try {
          const response = await fetch(el.src);
          const blob = await response.blob();
          const name = `${Date.now()}-${i + index}-${Math.random().toString(36).substr(2, 5)}`;
          const fileRef = storageRef(storage, `post-${folder}/${userId}/${name}`);

          return new Promise((res, rej) => {
            let lastPercent = 0;
            const uploadTask = uploadBytesResumable(fileRef, blob);
            uploadTask.on('state_changed',
              (snapshot) => {
                if (onProgress && folder === 'videos') {
                  const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                  if (percent !== lastPercent) {
                    lastPercent = percent;
                    onProgress(percent);
                  }
                }
              },
              rej,
              async () => {
                try {
                  const url = await getDownloadURL(fileRef);
                  completed++;
                  if (onProgress && folder === 'videos') {
                    onProgress(Math.round((completed / total) * 100));
                  }
                  res({ element: el, url });
                } catch (err) {
                  rej(err);
                }
              }
            );
          });
        } catch (err) {
          console.error('Upload failed:', err);
          return null;
        }
      })
    );
    results.push(...batchResults);
  }

  return results.filter(result => result.status === 'fulfilled' && result.value);
};

export const updatePostStore = (data) => (dispatch, getState) => {
  return new Promise((res, rej) => {
    try {
      dispatch({ type: UPDATE_POST_STORE, payload: data });
    } catch (err) {
      console.log('err',err);
    }
  })
};

export const getCollectionCount = (collection) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const colRef = collection(db, collection);
      const snapshot = await getCountFromServer(colRef);
      res(snapshot.data().count);
    } catch (err) {
      console.error(`Error getting count from ${collection}:`, err);
      rej(err);
    }
  });
};

export const getSubcollectionCount = (parentPath, subCollection) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const subcollectionRef = collection(db, `${parentPath}/${subCollection}`);
      const snapshot = await getCountFromServer(subcollectionRef);
      res(snapshot.data().count);
    } catch (err) {
      console.error(`Failed to get count from ${parentPath}/${subCollection}:`, err);
      rej(err);
    }
  });
};

export const listenForNewPosts = () => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    const { user, post } = getState();
    if (!user.authenticated) return res(null);
    const lastCreatedAt = post.posts[0]?.createdAt;
    if (!lastCreatedAt) return res(null);

    const newQuery = query(
      collection(db, 'posts'),
      where('createdAt', '>', lastCreatedAt),
      orderBy('createdAt', 'asc')
    );

    try {
      const unsubscribe = onSnapshot(newQuery, (snapshot) => {
        if (snapshot.empty) return;
        let updatedPosts = [...getState().post.posts];

        snapshot.docChanges().forEach((change) => {
          const docId = change.doc.id;
          const data = change.doc.data();
          if (!data.createdAt) return;

          if (change.type === 'added') {
            const exists = updatedPosts.find((p) => p.id === docId);
            if (!exists) {
              updatedPosts.unshift({ id: docId, ...data, type: 'post' });
            }
          }

          if (change.type === 'modified') {
            updatedPosts = updatedPosts.map((post) =>
              post.id === docId ? { ...post, ...data } : post
            );
          }

          if (change.type === 'removed') {
            updatedPosts = updatedPosts.filter((post) => post.id !== docId);
          }
        });

        updatedPosts.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
        dispatch(updatePostStore({ posts: updatedPosts }));
      });

      res(true);
    } catch (err) {
      console.error('Error setting up snapshot:', err);
      rej(err);
    }
  });
};

export const getHashTags = () => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const q = query(
        collection(db, 'tags'),
        orderBy('frequency', 'desc'),
        limit(5)
      );

      const snap = await getDocsFromCache(q).catch(() => getDocs(q));
      const tags = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      dispatch(updatePostStore({ hashtags: tags }));

      res(true);
    } catch (err) {
      console.error('Failed to load tags:', err);
      rej(err);
    }
  });
};

export const getPostAndSponsored = () => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    const { post } = getState();
    const { lastPostVisible, lastSponsoredVisible, posts, sponsored } = post;
    if (posts.length === 0) return res(false);
    if (lastPostVisible && lastSponsoredVisible) return res(false);
    try {
      const promises = [];
      if (!lastPostVisible) {
        promises.push(dispatch(getPosts()));
      }
      if (!lastSponsoredVisible) {
        promises.push(dispatch(getSponsored()));
      }
      const t0 = performance.now();
      await Promise.all(promises);
      const t1 = performance.now();
      console.log('scroll data:', ((t1 - t0) / 1000).toFixed(2), 's');
      res(true);
    } catch (err) {
      console.error('Error loading posts and sponsored:', err);
      rej(err);
    } 
  });
};

export const getPosts = () => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const { authenticated, email } = getState().user
      const { sort, myPosts, selectedTags, lastPost, posts } = getState().post
      const queryConditions = []

      if (authenticated && myPosts) {
        queryConditions.push(where('useremail', '==', email))
      }
      queryConditions.push(
        sort === 'recent'
          ? orderBy('createdAt', 'desc')
          : orderBy('lovesCount', 'desc')
      )
      if (selectedTags.length > 0) {
        queryConditions.push(where('tags', 'array-contains-any', selectedTags))
      }
      if (lastPost) {
        queryConditions.push(startAfter(lastPost))
      }
      const postLimit = 5
      queryConditions.push(limit(postLimit))
      const postQuery = query(collection(db, 'posts'), ...queryConditions)
      const snap = await getDocs(postQuery)
      const newPosts = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'post'
      }))
      const allFetched = snap.docs.length < postLimit
      if (newPosts.length > 0) {
        dispatch(updatePostStore({ 
          posts: [...posts, ...newPosts],
          lastPost: snap.docs[snap.docs.length - 1],
          lastPostVisible: allFetched
         }))
      } else if (allFetched) {
        dispatch(updatePostStore({ lastPostVisible: true }))
      }
      res(true)
    } catch (error) {
      rej(error)
    }
  })
}

export const getPostsByUser = (userId, reset = false) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const { post } = getState();
      const { userPosts = [], lastUserPost, lastUserPostVisible } = post;
      if (reset) {
        dispatch(updatePostStore({
          userPosts: [],
          lastUserPost: null,
          lastUserPostVisible: false
        }));
      }
      if (lastUserPostVisible && !reset) return res(true);
      const queryConditions = [
        where('ownerId', '==', userId),
        orderBy('createdAt', 'desc')
      ];
      if (lastUserPost && !reset) {
        queryConditions.push(startAfter(lastUserPost));
      }
      const postLimit = 10;
      queryConditions.push(limit(postLimit));
      const postQuery = query(collection(db, 'posts'), ...queryConditions);
      const snap = await getDocs(postQuery);
      const newPosts = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'post'
      }));
      const allFetched = snap.docs.length < postLimit;
      if (newPosts.length > 0) {
        const updatedPosts = reset ? newPosts : [...userPosts, ...newPosts];
        dispatch(updatePostStore({ 
          userPosts: updatedPosts,
          lastUserPost: snap.docs[snap.docs.length - 1],
          lastUserPostVisible: allFetched
        }));
      } else if (allFetched) {
        dispatch(updatePostStore({ lastUserPostVisible: true }));
      }
      res(true);
    } catch (error) {
      console.error('Failed to load user posts:', error);
      rej(error);
    } 
  });
};

export const getSponsored = () => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const { post } = getState()
      const { lastSponsored, sponsored = [], } = post
      const conditions = [
        where('state', '==', 'Approved'),
        orderBy('budget', 'desc')
      ]
      if (lastSponsored) {
        conditions.push(startAfter(lastSponsored))
      }
      const limitCount = 5
      conditions.push(limit(limitCount))
      const sponsoredQuery = query(collection(db, 'sponsored'), ...conditions)
      const snap = await getDocs(sponsoredQuery)
      const newDocs = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'sponsored'
      }))
      const allSponsoredFetched = snap.docs.length < limitCount
      if (newDocs.length > 0) {
        dispatch(updatePostStore({ 
          sponsored: [...sponsored, ...newDocs],
          lastSponsored: snap.docs[snap.docs.length - 1],
          lastSponsoredVisible: allSponsoredFetched
        }))
      } else if (allSponsoredFetched) {
        dispatch(updatePostStore({ lastSponsoredVisible: true }))
      }
      res(true)
    } catch (error) {
      console.error('Failed to load sponsored ads:', error)
      rej(error)
    }
  })
}

export const getBannerAds = () => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const adsQuery = query(
        collection(db, 'ads'),
        where('billed', '==', true),
        // where('state', '==', 'public'),
        where('state', '==', 'Approved'),
        limit(5)
      )
      const adsSnap = await getDocs(adsQuery)
      const ads = adsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      if (ads.length > 0) {
        if (analytics) {
          logEvent(analytics, 'direct_ad_loaded', { 
            count: ads.length,
            ad_ids: ads.map(ad => ad.id)
          });
        }
      }
      dispatch(updatePostStore({ bannerAds: ads }))
      res(true)
    } catch (error) {
      console.error('Failed to load banner ads:', error);
      dispatch(updatePostStore({ bannerAds: [] }))
      rej(error)
    }
  });
}

export const searchPostsByKeywords = (keywordsArray, reset = false) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const { post } = getState();
      const { searchPosts = [], lastSearchPost, lastSearchPostVisible } = post;
      
      if (!keywordsArray || keywordsArray.length === 0) {
        dispatch(updatePostStore({ 
          searchPosts: [], 
          lastSearchPost: null, 
          lastSearchPostVisible: false,
          isSearchMode: false 
        }));
        return res(true);
      }

      if (reset) {
        dispatch(updatePostStore({
          searchPosts: [],
          lastSearchPost: null,
          lastSearchPostVisible: false,
          isSearchMode: true
        }));
      }

      if (lastSearchPostVisible && !reset) return res(true);

      const queryConditions = [
        where('keywords', 'array-contains-any', keywordsArray),
        orderBy('createdAt', 'desc')
      ];

      if (lastSearchPost && !reset) {
        queryConditions.push(startAfter(lastSearchPost));
      }

      const searchLimit = 5;
      queryConditions.push(limit(searchLimit));

      const searchQuery = query(collection(db, 'posts'), ...queryConditions);
      const snap = await getDocs(searchQuery);

      const newSearchPosts = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        type: 'post'
      }));

      const allFetched = snap.docs.length < searchLimit;

      if (newSearchPosts.length > 0) {
        const updatedSearchPosts = reset ? newSearchPosts : [...searchPosts, ...newSearchPosts];
        dispatch(updatePostStore({ 
          searchPosts: updatedSearchPosts,
          lastSearchPost: snap.docs[snap.docs.length - 1],
          lastSearchPostVisible: allFetched,
          isSearchMode: true
        }));
      } else if (allFetched) {
        dispatch(updatePostStore({ 
          lastSearchPostVisible: true,
          isSearchMode: true 
        }));
      }

      res(true);
    } catch (error) {
      console.error('Failed to search posts:', error);
      rej(error);
    } 
  });
};

// post
export const createPost = ({ quill, tags, address }) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    const { user } = getState();
    try {
      const clonedRoot = quill.root.cloneNode(true);
      clonedRoot.querySelectorAll('.quill-delete-btn').forEach(btn => btn.remove());
      let contentHtml = clonedRoot.innerHTML.trim();
      const imageElements = clonedRoot.getElementsByTagName('img');
      const videoElements = clonedRoot.getElementsByTagName('video');

      if (imageElements.length > 10) {
        return rej('Too many images');
      }
      if (videoElements.length > 1) { 
        return rej('Too many videos');
      }

      const startMedia = performance.now();
      // For images: no progress. For videos: dispatch progress.
      const [imageResults, videoResults] = await Promise.all([
        optimizedUploadMedia(imageElements, 'images', user.id),
        optimizedUploadMedia(videoElements, 'videos', user.id, (percent) => {
          dispatch(updateBaseStore({ videoUploadProgress: percent }));
        })
      ]);
      // Reset progress after video upload
      dispatch(updateBaseStore({ videoUploadProgress: null }));

      [...imageResults, ...videoResults].forEach(result => {
        if (result.value) {
          contentHtml = contentHtml.replace(result.value.element.src, result.value.url);
        }
      });

      const endMedia = performance.now();
      console.log(`Optimized media uploads took ${(endMedia - startMedia) / 1000} seconds.`);

      const keywords = memoizedExtractKeywords(contentHtml, tags, address);

      const batch = writeBatch(db);
      const postRef = doc(collection(db, 'posts'));
      const userRef = doc(db, 'users', user.id);

      batch.set(postRef, {
        contentHtml,
        address,
        tags,
        keywords,
        ownerId: user.id,
        username: user.username,
        useremail: user.email,
        userPhoto: user.photoUrl || '',
        likesCount: 0,
        lovesCount: 0,
        laughsCount: 0,
        commentsCount: 0,
        shares: 0,
        savesCount: 0,
        createdAt: serverTimestamp(),
      });

      batch.update(userRef, { postCount: increment(1) });
      await batch.commit();

      res(true);
    } catch (err) {
      console.error('Error creating post:', err);
      dispatch(updateBaseStore({ videoUploadProgress: null }));
      rej(err);
    }
  });
};

export const handlePostCreationFollowUps = ({ postRef, currentUser, tags }) => async (dispatch, getState) => {
  const { user, colleague } = getState();
  const userRef = doc(db, 'users', currentUser.uid);
  const postCountUpdate = updateDoc(userRef, { postCount: increment(1) });
  const followerList = Array.isArray(colleague.followers) ? colleague.followers : [];
  const activeFollowers = followerList.filter(f => f.state !== 'unfollowed');

  const BATCH_LIMIT = 500;
  const followerChunks = [];
  for (let i = 0; i < activeFollowers.length; i += BATCH_LIMIT) {
    followerChunks.push(activeFollowers.slice(i, i + BATCH_LIMIT));
  }

  const followerBatchCommits = followerChunks.map(chunk => {
    const batch = writeBatch(db);
    chunk.forEach(follower => {
      const msgRef = doc(collection(db, 'messages'));
      batch.set(msgRef, {
        actionId: user.id,
        actionName: user.username,
        from: 'site',
        to: follower.id,
        postId: postRef.id,
        read: 0,
        action: 'create',
        what: 'post',
        type: 'post',
        timestamp: serverTimestamp(),
      });
    });
    return batch.commit();
  });
  const tagBatch = writeBatch(db);
  const newTags = [...user.tags];
  tags.forEach(tag => {
    const existingTag = user.tags.find(t => t.tag === tag);
    if (existingTag) {
      const tagRef = doc(db, 'tags', existingTag.id);
      tagBatch.update(tagRef, { frequency: existingTag.frequency + 1 });

      const idx = newTags.findIndex(t => t.id === existingTag.id);
      newTags[idx].frequency++;
    } else {
      const newRef = doc(collection(db, 'tags'));
      tagBatch.set(newRef, { tag, frequency: 1 });
      newTags.push({ id: newRef.id, tag, frequency: 1 });
    }
  });
  try {
    await Promise.all([
      postCountUpdate,
      ...followerBatchCommits,
      tagBatch.commit()
    ]);
  } catch (err) {
    console.error('Post follow-up error:', err);
  }
  dispatch(updateBaseStore({ tags: newTags, }));
};

export const updatePost = ({ id, editorInstance, tags = [], address = '' }) => (dispatch, getState) => {
  return new Promise( async (res, rej) => {
    try {
      const {user} = getState();
      const clonedRoot = editorInstance.root.cloneNode(true);
      clonedRoot.querySelectorAll('.quill-delete-btn')?.forEach(btn => btn.remove());

      let contentHtml = clonedRoot.innerHTML.trim();

      const imageElements = clonedRoot.getElementsByTagName('img');
      const videoElements = clonedRoot.getElementsByTagName('video');

      const uploadMedia = (elements, folder) => {
        return new Promise( (resUploads) => {
          const tasks = Array.from(elements).map(async (el) => {
            if (el.src.startsWith('https://')) return null;

            try {
              const response = await fetch(el.src);
              const blob = await response.blob();
              const name = `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
              const fileRef = storageRef(storage, `post-${folder}/${user.id}/${name}`);
              const uploadTask = uploadBytesResumable(fileRef, blob);

              return new Promise((res, rej) => {
                uploadTask.on(
                    'state_changed',
                    null,
                    rej,
                    async () => {
                      const url = await getDownloadURL(fileRef);
                      contentHtml = contentHtml.replace(el.src, url);
                      res();
                    }
                );
              });
            } catch (err) {
              console.error('Upload failed:', err);
              return null;
            }
          });

          Promise.allSettled(tasks).then(resUploads);
        });
      };

      await Promise.all([
        uploadMedia(imageElements, 'images'),
        uploadMedia(videoElements, 'videos'),
      ]);


      const keywords = memoizedExtractKeywords(contentHtml, tags, address);

      const postRef = doc(db, 'posts', id);
      await updateDoc(postRef, {contentHtml, keywords});
      res({contentHtml, keywords});
    } catch (err) {
      console.error('Failed to update post:', err);
      rej(err);
    }
  });
};

export const deletePost = ({ id, ownerId }) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const { user } = getState();
      if (user.id !== ownerId && !user.role?.admin) {
        return rej('Permission denied');
      }
      const postRef = doc(db, 'posts', id);
      const userRef = doc(db, 'users', ownerId);
      const subcollections = ['comments', 'interactions',];
      for (const sub of subcollections) {
        const subRef = collection(postRef, sub);
        const snapshot = await getDocs(subRef);
        if (!snapshot.empty) {
          const batch = writeBatch(db);
          snapshot.forEach((docSnap) => {
            batch.delete(docSnap.ref);
          });
          await batch.commit();
        }
      }
      const batch = writeBatch(db);
      batch.delete(postRef);
      batch.update(userRef, { postCount: increment(-1) });
      await batch.commit();
      const { posts } = getState().post;
      const updatedPosts = posts.filter(post => post.id !== id);
      dispatch(updatePostStore({
        posts: updatedPosts,
        lastPost: updatedPosts.length > 0 ? updatedPosts[updatedPosts.length - 1] : null
      }));
      res(true);
    } catch (err) {
      console.error("Failed to delete post and subcollections:", err);
      rej(err);
    } 
  });
};

export const updateFollowers = (followEmail) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const { email, id } = getState().user;

      if (!id) throw new Error("User ID is missing");

      const userDoc = doc(db, "users", id);
      const userSnap = await getDoc(userDoc);

      if (!userSnap.exists()) throw new Error("User document not found");

      const currentFollowers = userSnap.data().followers || [];

      if (currentFollowers.includes(followEmail)) {
        await updateDoc(userDoc, {
          followers: arrayRemove(followEmail),
        });
      } else {
        await updateDoc(userDoc, {
          followers: arrayUnion(followEmail),
        });
      }

      const updatedSnap = await getDoc(userDoc);
      dispatch(updateUserStore({ ...updatedSnap.data(), id }));

      res(true);
    } catch (err) {
      console.error("Failed to follow/unfollow user:", err.message);
      rej(err);
    }
  });
};

export const updateRecommendation = (recommendations, info) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    const { type, option, time, userInteractions = {}, contentHtml } = info;
    const { username, email, photoURL, blocks, id: actionId } = getState().user;
    const { id, ownerId } = recommendations;
    const post = doc(db, 'posts', id);
    const interactionRef = doc(db, 'posts', id, 'interactions', actionId);
    const batch = writeBatch(db);

    try {
      let action = '';
      if (['like', 'love', 'laugh', 'follow'].includes(type)) {
        const alreadySet = !!userInteractions[type];
        action = alreadySet ? 'remove' : 'add';
        batch.update(post, {
          [`${type}sCount`]: increment(alreadySet ? -1 : 1),
        });
        batch.set(interactionRef, { [type]: !alreadySet }, { merge: true });
      }
      else if (type === 'save') {
        const alreadySet = !!userInteractions.save;
        action = alreadySet ? 'remove' : 'add';
        batch.update(post, {
          savesCount: increment(alreadySet ? -1 : 1),
        });
        batch.set(interactionRef, { save: !alreadySet }, { merge: true });
      }
      else if (type === 'repost') {
        const alreadySet = !!userInteractions.repost;
        if (!alreadySet) {
          const { username, email, photoUrl, id: actionId } = getState().user;
          const newPostRef = doc(collection(db, 'posts'));
          

          const originalPostRef = doc(db, 'posts', id);
          const originalPostSnap = await getDoc(originalPostRef);
          const originalPostData = originalPostSnap.data();
          

          const keywords = memoizedExtractKeywords(contentHtml, originalPostData?.tags || [], originalPostData?.address || '');

          const newRepostData = {
            type: 'repost',
            originalPostId: id,
            repostedBy: actionId,
            userPhoto: photoUrl || "",
            username: username || "",
            useremail: email,
            ownerId: actionId,
            contentHtml: contentHtml,
            keywords,
            likesCount: 0,
            lovesCount: 0,
            repostsCount: 0,
            sharesCount: 0,
            commentsCount: 0,
            reportsCount: 0,
            savesCount: 0,
            createdAt: serverTimestamp(),
          };

          batch.set(newPostRef, newRepostData);
          batch.update(post, { repostsCount: increment(1) });
          batch.set(interactionRef, { repost: true }, { merge: true });
        } else {
          return { success: false, message: 'Already reposted' };
        }
      }
      else if (type === 'report') {
        const alreadySet = !!userInteractions.report;
        if (!alreadySet) {
          batch.set(interactionRef, {
            report: true,
            option,
            reportedAt: serverTimestamp(),
          }, { merge: true });
        } else {
          return rej(new Error('Already reported'));
        }
      }
      else if (type === 'share') {
        batch.update(post, { shares: increment(1) });
        const path = `${window.location.origin}/post/${id}`;
        try {
          await navigator.clipboard.writeText(path);
          alert(`${path} was copied.`);
        } catch (err) {
          console.warn('Clipboard API failed, using fallback.', err);
          try {
            const textarea = document.createElement("textarea");
            textarea.value = path;
            textarea.setAttribute("readonly", "");
            textarea.style.position = "absolute";
            textarea.style.left = "-9999px";
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand("copy");
            document.body.removeChild(textarea);
          } catch (fallbackErr) {
            return rej(fallbackErr);
          }
        }
        await batch.commit();
        return res({ success: true, action });
      }
      else if (type === 'block') {
        const userRef = doc(db, 'users', actionId);
        if (!blocks.includes(ownerId)) {
          action = 'add';
          batch.update(userRef, { blocks: arrayUnion(ownerId) });
          dispatch(updateUserStore({ blocks: [...blocks, ownerId] }));
        } else {
          action = 'remove';
          batch.update(userRef, { blocks: arrayRemove(ownerId) });
          dispatch(updateUserStore({ blocks: blocks.filter(b => b !== ownerId) }));
        }
      }
      await batch.commit();
      return res({ success: true, action });
    } catch (error) {
      console.error(error);
      return rej(error);
    }
  });
};

// comment
export const getPostComments = (postId, updateComments) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const { lastComment, lastCommentVisible } = updateComments;
      if (lastCommentVisible) {
        return res([]);
      }
      const commentsLimit = 5;
      const conditions = [orderBy('createdAt', 'asc')];
      if (lastComment) {
        conditions.push(startAfter(lastComment.createdAt));
      }

      conditions.push(limit(commentsLimit));
      const q = query(collection(db, 'posts', postId, 'comments'), ...conditions);
      const snap = await getDocs(q);

      const newComments = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      res(newComments)

    } catch (err) {
      console.error('Failed to load comments:', err);
      rej(err);
    } 
  });
};

export const createComment = ({ quill, postId }) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    const { user } = getState();
    try {
      const clonedRoot = quill.root.cloneNode(true);
      clonedRoot.querySelectorAll('.quill-delete-btn')?.forEach(btn => btn.remove());
      let contentHtml = clonedRoot.innerHTML.trim();
      const imageElements = clonedRoot.getElementsByTagName('img');

      const uploadMedia = async (elements, folder) => {
        const tasks = Array.from(elements).map(async (el) => {
          if (el.src.startsWith('https://')) return null;
          try {
            const response = await fetch(el.src);
            const blob = await response.blob();
            const name = `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
            const fileRef = storageRef(storage, `${folder}/${user.id}/${name}`);
            const uploadTask = uploadBytesResumable(fileRef, blob);

            return new Promise((res, rej) => {
              uploadTask.on(
                'state_changed',
                null,
                (error) => {
                  console.error('Upload failed:', error);
                  rej(error);
                },
                async () => {
                  try {
                    const url = await getDownloadURL(fileRef);
                    contentHtml = contentHtml.replace(el.src, url);
                    res();
                  } catch (err) {
                    console.error('Error getting download URL:', err);
                    rej(err);
                  }
                }
              );
            });
          } catch (err) {
            console.error('Image upload error:', err);
            return null;
          }
        });
        return Promise.allSettled(tasks);
      };

      await uploadMedia(imageElements, 'images');

      const commentId = Date.now().toString();
      const newComment = {
        postId,
        userId: user.id,
        useremail: user.email,
        username: user.username || '',
        userPhoto: user.photoUrl || '',
        contentHtml,
        createdAt: serverTimestamp(),
      };

      const batch = writeBatch(db);
      const commentRef = doc(db, 'posts', postId, 'comments', commentId);
      const postRef = doc(db, 'posts', postId);
      batch.set(commentRef, newComment);
      batch.update(postRef, { commentsCount: increment(1) });
      await batch.commit();

      const commentDoc = await getDoc(commentRef);
      const commentData = commentDoc.data();
      res({ ...commentData, id: commentId });
    } catch (error) {
      console.error('Failed to create comment:', error);
      rej(error);
    } 
  });
};

export const updateComment = (postId, commentId, updatedContentHtml) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const commentRef = doc(db, 'posts', postId, 'comments', commentId);
      await updateDoc(commentRef, { contentHtml: updatedContentHtml });
      res(true);
    } catch (err) {
      console.error('Failed to update comment:', err);
      rej({ success: false, error: err.message || 'Update failed.' });
    } 
  });
};

export const deleteComment = (postId, commentId) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const batch = writeBatch(db);
      const commentRef = doc(db, 'posts', postId, 'comments', commentId);
      const postRef = doc(db, 'posts', postId);
      batch.delete(commentRef);
      batch.update(postRef, { commentsCount: increment(-1) });
      await batch.commit();
      res(true);
    } catch (err) {
      console.error('Failed to delete comment and update count:', err);
      rej(err);
    } 
  });
};
