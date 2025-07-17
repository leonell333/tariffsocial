import {UPDATE_COLLEAGUE_STORE} from "../types";
import {db} from "../../firebase"
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getCountFromServer,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  where,
  writeBatch
} from "firebase/firestore";
import {updateUserStore} from './userActions';

export const updateColleagueStore = (data) => (dispatch, getState) => {
  return new Promise((res, rej) => {
    try {
      dispatch({ type: UPDATE_COLLEAGUE_STORE, payload: data });
    } catch (err) {
      console.log('err',err);
    }
  })
};

export const getColleagues = () => async (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const { colleague, user } = getState();
      if (!user.id) return
      const { lastColleague, colleagues = [], lastColleagueVisible } = colleague;
      const myTags = user?.tags || [];
      if (lastColleagueVisible || myTags.length === 0) return res(true);
      const conditions = [
        where('tags', 'array-contains-any', myTags),
        where('__name__', '!=', user.id),
        orderBy('postCount', 'desc'),
      ];
      if (lastColleague) {
        conditions.push(startAfter(lastColleague));
      }
      const limitCount = 8;
      conditions.push(limit(limitCount));
      const q = query(collection(db, 'users'), ...conditions);
      const snap = await getDocs(q);
      const newDocs = snap.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      const allColleaguesFetched = snap.docs.length < limitCount;
      if (newDocs.length > 0) {
        dispatch(updateColleagueStore({
          colleagues: [...colleagues, ...newDocs],
          lastColleague: snap.docs[snap.docs.length - 1],
          lastColleagueVisible: allColleaguesFetched
        }));
      } else if (allColleaguesFetched) {
        dispatch(updateColleagueStore({ lastColleagueVisible: true }));
      }
      res(true);
    } catch (err) {
      console.error('Failed to load colleagues:', err);
      rej(err);
    }
  });
};

export const getNewColleagues = () => async (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const { user } = getState();
      if (!user.id) return
      const myTags = user?.tags || [];
      if (myTags.length === 0) return res(true);
      const conditions = [
        where('tags', 'array-contains-any', myTags),
        where('__name__', '!=', user.id),
        orderBy('createdAt', 'desc'),
      ];
      const limitCount = 3;
      conditions.push(limit(limitCount));
      const q = query(collection(db, 'users'), ...conditions);
      const snap = await getDocs(q);
      const topUsers  = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      if (topUsers.length > 0) {
        dispatch(updateColleagueStore({ newColleagues: topUsers }));
      }
      res(true);
    } catch (err) {
      console.error('Failed to load colleagues:', err);
      rej(err);
    }
  });
};

export const followAction = (followUser) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const { id, username, photoUrl, information, follows: userFollows, followCount } = getState().user;
      const { colleagues, follows: colleagueFollows, followers: colleagueFollowers } = getState().colleague;
      if (!id || !followUser?.id) return;
      const isFollowing = userFollows.includes(followUser.id);
      const batch = writeBatch(db);
      const followerRef = doc(db, `users/${followUser.id}/followers/${id}`);
      const followRef = doc(db, `users/${id}/follows/${followUser.id}`);
      const currentUserRef = doc(db, `users/${id}`);
      const targetUserRef = doc(db, `users/${followUser.id}`);
      const notificationRef = doc(collection(db, 'messages'));
      let updateFollowerCount = 0, updateFollowCount = 0;
      if (isFollowing) {
        batch.delete(followerRef);
        batch.delete(followRef);
        batch.update(currentUserRef, { 
          followCount: increment(-1),
          follows: arrayRemove(followUser.id)
        });
        batch.update(targetUserRef, { 
          followerCount: increment(-1),
          followers: arrayRemove(id)
        });
        batch.set(notificationRef, {
          from: id,
          username: username,
          to: followUser.id,
          action: 'send',
          type: 'notify',
          messageType: 'text',
          message: `${username} unfollowed you`,
          read: 0,
          timestamp: serverTimestamp(),
          userPhoto: photoUrl
        });
        updateFollowerCount = followUser.followerCount - 1
        updateFollowCount = followCount - 1
        const updatedUserFollows = userFollows.filter(followId => followId !== followUser.id);
        dispatch(updateUserStore({ 
          followCount: updateFollowCount,
          follows: updatedUserFollows
        }));
        const updatedColleagueFollows = colleagueFollows.filter(follow => follow.followedId !== followUser.id);
        const sortedFollows = updatedColleagueFollows.sort((a, b) => new Date(b.followedAt) - new Date(a.followedAt));
        const newLastFollow = sortedFollows.length > 0 ? sortedFollows[sortedFollows.length - 1] : null;
        dispatch(updateColleagueStore({ 
          follows: sortedFollows,
          lastFollow: newLastFollow
        }));
      } else {
        batch.set(followerRef, {
          followerId: id,
          username,
          photoUrl,
          information,
          followedAt: serverTimestamp()
        });
        batch.set(followRef, {
          followedId: followUser.id,
          username: followUser.username,
          photoUrl: followUser.photoUrl,
          information: followUser.information,
          followedAt: serverTimestamp()
        });
        batch.update(currentUserRef, { 
          followCount: increment(1),
          follows: arrayUnion(followUser.id)
        });
        batch.update(targetUserRef, { 
          followerCount: increment(1),
          followers: arrayUnion(id)
        });
        
        batch.set(notificationRef, {
          from: id,
          username: username,
          to: followUser.id,
          action: 'send',
          type: 'notify',
          messageType: 'text',
          message: `${username} started following you`,
          read: 0,
          timestamp: serverTimestamp(),
          userPhoto: photoUrl
        });
        updateFollowerCount = followUser.followerCount + 1
        updateFollowCount = followCount + 1
        const updatedUserFollows = [...userFollows, followUser.id];
        dispatch(updateUserStore({ 
          followCount: updateFollowCount,
          follows: updatedUserFollows
        }));
        const newFollow = {
          followedId: followUser.id,
          username: followUser.username,
          photoUrl: followUser.photoUrl,
          information: followUser.information,
          followedAt: new Date()
        };
        const updatedColleagueFollows = [...colleagueFollows, newFollow];
        const sortedFollows = updatedColleagueFollows.sort((a, b) => new Date(b.followedAt) - new Date(a.followedAt));
        const newLastFollow = sortedFollows[sortedFollows.length - 1];
        dispatch(updateColleagueStore({ 
          follows: sortedFollows,
          lastFollow: newLastFollow
        }));
      }
      await batch.commit();
      res(true);
    } catch (err) {
      console.error("Follow/Unfollow Error:", err);
      rej(err);
    }
  });
};

export const getTotalColleagueCount = () => (dispatch, getState) => {
   return new Promise(async (res, rej) => {
      const { user } = getState()
      const myTags = user.tags || [];
      if (myTags.length === 0 || user.id == "") return res(true);
      const conditions = [
        where('tags', 'array-contains-any', myTags),
        where('__name__', '!=', user.id),
      ];
      const usersRef = collection(db, 'users');
      const q = query(usersRef, ...conditions);
      try {
        const snapshot = await getCountFromServer(q);
        const count = snapshot.data().count;
        dispatch(updateUserStore({ colleagueCount: count}));
      res(true);
      } catch (err) {
        console.error('Error fetching total count of users:', err);
        rej(err);
      }
   });
};

export const getFollowers = () => async (dispatch, getState) => { 
  return new Promise(async (res, rej) => {
    try {
      const { colleague, user } = getState();
      if (!user.id) return;
      const { followers = [], lastFollower, lastFollowerVisible } = colleague;
      if (lastFollowerVisible) return res(true);
      const conditions = [
        orderBy('followedAt', 'desc')
      ];
      if (lastFollower) {
        conditions.push(startAfter(lastFollower));
      }
      const limitCount = 8;
      conditions.push(limit(limitCount));
      const q = query(collection(db, 'users', user.id, 'followers'), ...conditions);
      const snap = await getDocs(q);
      const newDocs = snap.docs.map(doc => doc.data());
      const allFollowersFetched = snap.docs.length < limitCount;
      if (newDocs.length > 0) {
        dispatch(updateColleagueStore({
          followers: [...followers, ...newDocs],
          lastFollower: snap.docs[snap.docs.length - 1],
          lastFollowerVisible: allFollowersFetched
        }));
      } else if (allFollowersFetched) {
        dispatch(updateColleagueStore({ lastFollowerVisible: true }));
      }
      res(true);
    } catch (err) {
      console.error('Failed to load followers:', err);
      rej(err);
    }
  });
};

export const getFollows = () => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const { colleague, user } = getState();
      if (!user.id) return;
      const { follows = [], lastFollow, lastFollowVisible } = colleague;
      if (lastFollowVisible) return res(true);
      const conditions = [
        orderBy('followedAt', 'desc')
      ];
      if (lastFollow) {
        conditions.push(startAfter(lastFollow));
      }
      const limitCount = 8;
      conditions.push(limit(limitCount));
      const q = query(collection(db, 'users', user.id, 'follows'), ...conditions);
      const snap = await getDocs(q);
      const newDocs = snap.docs.map(doc => doc.data());
      const allFollowsFetched = snap.docs.length < limitCount;
      if (newDocs.length > 0) {
        dispatch(updateColleagueStore({
          follows: [...follows, ...newDocs],
          lastFollow: snap.docs[snap.docs.length - 1],
          lastFollowVisible: allFollowsFetched
        }));
      } else if (allFollowsFetched) {
        dispatch(updateColleagueStore({ lastFollowVisible: true }));
      }
      res(true);
    } catch (err) {
      console.error('Failed to load follows:', err);
      rej(err);
    }
  });
};

export const resetFollowers = () => (dispatch, getState) => {
  return new Promise((res, rej) => {
    try {
      dispatch(updateColleagueStore({
        followers: [],
        lastFollower: null,
        lastFollowerVisible: false
      }));
      res(true);
    } catch (err) {
      console.log('err', err);
      rej(err);
    }
  });
};

export const resetAllNetData = () => (dispatch, getState) => {
  return new Promise((res, rej) => {
    try {
      dispatch(updateColleagueStore({
        follows: [],
        lastFollow: null,
        lastFollowVisible: false,
        followers: [],
        lastFollower: null,
        lastFollowerVisible: false
      }));
      res(true);
    } catch (err) {
      console.log('err', err);
      rej(err);
    }
  });
};

export const getTopFollowersByPosts = () => async (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const { user } = getState();
      if (!user.id) return res(true);
      if (user.followerCount === 0) {
        dispatch(updateColleagueStore({ topFollowers: [] }));
        return res(true);
      }
      const usersQuery = query(
        collection(db, 'users'),
        where('__name__', 'in', user.followers),
        orderBy('postCount', 'desc'),
        limit(3)
      );
      const usersSnapshot = await getDocs(usersQuery);
      const topFollowers = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      dispatch(updateColleagueStore({ topFollowers: topFollowers }));
      res(true);
    } catch (err) {
      console.error('Failed to load top followers by posts:', err);
      rej(err);
    }
  });
};