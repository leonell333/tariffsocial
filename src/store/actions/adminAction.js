import { collection, getDocs, orderBy, query, updateDoc, doc, limit, startAfter, getCountFromServer, deleteDoc, where, Timestamp } from "firebase/firestore";
import { db, storage, storageBucket } from "../../firebase";
import { getDownloadURL, ref as storageRef } from "firebase/storage";
import { UPDATE_ADMIN_STORE } from "../types";

export const updateAdminStore = (data) => (dispatch, getState) => {
  return new Promise((res, rej) => {
    try {
      dispatch({ type: UPDATE_ADMIN_STORE, payload: data });
      res(true);
    } catch (err) {
      console.log("err", err);
      rej(err);
    }
  });
};

export const getAllAds = ({ page = 1 } = {}) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const state = getState();
      const { adsPagination, lastAdvertise } = state.admin;
      const { pageSize } = adsPagination;

      let adsQuery;
      if (page === 1) {
        adsQuery = query(
          collection(db, "ads"),
          orderBy("createdAt", "desc"),
          limit(pageSize)
        );
      } else {
        adsQuery = query(
          collection(db, "ads"),
          orderBy("createdAt", "desc"),
          startAfter(lastAdvertise),
          limit(pageSize)
        );
      }
      const snap = await getDocs(adsQuery);
      const ads = snap.docs.map(doc_ => ({ id: doc_.id, ...doc_.data() }));
      const lastDoc = snap.docs[snap.docs.length - 1] || null;
      dispatch(updateAdminStore({
        advertise: ads,
        lastAdvertise: lastDoc
      }));
      res({ ads });
    } catch (error) {
      console.error("Failed to get all ads:", error);
      rej(error);
    }
  });
};

export const getTotalAds = () => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const adsQuery = query(collection(db, "ads"));
      const snap = await getCountFromServer(adsQuery);
      const count = snap.data().count;
      const { adsPagination } = getState().admin;
      dispatch(updateAdminStore({
        adsPagination: { ...adsPagination, total: count }
      }));
      res(count);
    } catch (error) {
      console.error("Failed to get total ads count:", error);
      rej(error);
    }
  });
};

export const updateAdStatus = ({ id, state }) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const adRef = doc(db, "ads", id);
      await updateDoc(adRef, { state });
      const currentAds = getState().admin.advertise || [];
      const updatedAds = currentAds.map(ad =>
        ad.id === id ? { ...ad, state } : ad
      );
      dispatch(updateAdminStore({ advertise: updatedAds }));
      res(true);
    } catch (error) {
      console.error("Failed to update ad status:", error);
      rej(error);
    }
  });
};

export const deleteAd = (id) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const adRef = doc(db, "ads", id);
      await deleteDoc(adRef);
      const currentAds = getState().admin.advertise || [];
      const updatedAds = currentAds.filter(ad => ad.id !== id);
      dispatch(updateAdminStore({ advertise: updatedAds }));
      res(true);
    } catch (error) {
      console.error("Failed to delete ad:", error);
      rej(error);
    }
  });
};

export const getAllSponsored = ({ page = 1 } = {}) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const state = getState();
      const { pagination, lastSponsored } = state.admin;
      const { pageSize } = pagination;

      let sponsoredQuery;
      if (page === 1) {
        sponsoredQuery = query(
          collection(db, "sponsored"),
          orderBy("createdAt", "desc"),
          limit(pageSize)
        );
      } else {
        sponsoredQuery = query(
          collection(db, "sponsored"),
          orderBy("createdAt", "desc"),
          startAfter(lastSponsored),
          limit(pageSize)
        );
      }
      const snap = await getDocs(sponsoredQuery);
      const sponsoreds = snap.docs.map(doc_ => ({ id: doc_.id, ...doc_.data() }));
      const lastDoc = snap.docs[snap.docs.length - 1] || null;
      dispatch(updateAdminStore({
        sponsored: sponsoreds,
        lastSponsored: lastDoc
      }));
      res({ sponsoreds });
    } catch (error) {
      console.error("Failed to get all sponsored ads:", error);
      rej(error);
    }
  });
};

export const getTotalSponsored = () => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const sponsoredQuery = query(collection(db, "sponsored"));
      const snap = await getCountFromServer(sponsoredQuery);
      const count = snap.data().count;
      const { pagination } = getState().admin;
      dispatch(updateAdminStore({
        pagination: { ...pagination, total: count }
      }));
      res(count);
    } catch (error) {
      console.error("Failed to get total sponsored count:", error);
      rej(error);
    }
  });
};

export const deleteSponsored = (id) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const sponsoredRef = doc(db, "sponsored", id);
      await deleteDoc(sponsoredRef);
      const currentSponsored = getState().admin.sponsored || [];
      const updatedSponsored = currentSponsored.filter(s => s.id !== id);
      dispatch(updateAdminStore({ sponsored: updatedSponsored }));
      res(true);
    } catch (error) {
      console.error("Failed to delete sponsored:", error);
      rej(error);
    }
  });
};

export const getAllPost = ({ page = 1 } = {}) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const state = getState();
      const { pagination, lastPost } = state.admin;
      const { pageSize } = pagination;

      let postsQuery;
      if (page === 1) {
        postsQuery = query(
          collection(db, "posts"),
          orderBy("createdAt", "desc"),
          limit(pageSize)
        );
      } else {
        postsQuery = query(
          collection(db, "posts"),
          orderBy("createdAt", "desc"),
          startAfter(lastPost),
          limit(pageSize)
        );
      }
      
      const snap = await getDocs(postsQuery);
      const posts = snap.docs.map(doc_ => ({ id: doc_.id, ...doc_.data() }));
      const lastDoc = snap.docs[snap.docs.length - 1] || null;
      
      dispatch(updateAdminStore({
        post: posts,
        lastPost: lastDoc
      }));
      res({ posts });
    } catch (error) {
      console.error("Failed to get all posts:", error);
      rej(error);
    }
  });
};

export const updatePostStatus = ({ id, state }) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const postRef = doc(db, "posts", id);
      await updateDoc(postRef, { state });
      const currentPosts = getState().admin.post || [];
      const updatedPosts = currentPosts.map(post =>
        post.id === id ? { ...post, state } : post
      );
      dispatch(updateAdminStore({ post: updatedPosts }));
      res(true);
    } catch (error) {
      console.error("Failed to update post status:", error);
      rej(error);
    }
  });
};

export const getTotalPosts = () => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const postsQuery = query(collection(db, "posts"));
      const snap = await getCountFromServer(postsQuery);
      const count = snap.data().count;
      const pagination = getState().admin.pagination;
      dispatch(updateAdminStore({
        totalPost: count,
        pagination: { ...pagination, total: count }
      }));
      res(count);
    } catch (error) {
      console.error("Failed to get total posts count:", error);
      rej(error);
    }
  });
};

export const getAllUsers = ({ page = 1 } = {}) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const state = getState();
      const { pagination, lastUser } = state.admin;
      const { pageSize } = pagination;

      let usersQuery;
      if (page === 1) {
        usersQuery = query(
          collection(db, "users"),
          orderBy("createdAt", "desc"),
          limit(pageSize)
        );
      } else {
        usersQuery = query(
          collection(db, "users"),
          orderBy("createdAt", "desc"),
          startAfter(lastUser),
          limit(pageSize)
        );
      }

      const snap = await getDocs(usersQuery);
      const users = snap.docs.map(doc_ => ({ id: doc_.id, ...doc_.data() }));
      const lastDoc = snap.docs[snap.docs.length - 1] || null;

      dispatch(updateAdminStore({
        user: users,
        lastUser: lastDoc
      }));
      res({ users });
    } catch (error) {
      console.error("Failed to get all users:", error);
      rej(error);
    }
  });
};

export const getTotalUsers = () => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const usersQuery = query(collection(db, "users"));
      const snap = await getCountFromServer(usersQuery);
      const count = snap.data().count;
      const pagination = getState().admin.pagination;
      dispatch(updateAdminStore({
        totalUser: count,
        pagination: { ...pagination, total: count }
      }));
      res(count);
    } catch (error) {
      console.error("Failed to get total users count:", error);
      rej(error);
    }
  });
};

export const updateUser = ({ id, data }) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const userRef = doc(db, "users", id);
      await updateDoc(userRef, data);
      const currentUsers = getState().admin.user || [];
      const updatedUsers = currentUsers.map(u => u.id === id ? { ...u, ...data } : u);
      dispatch(updateAdminStore({ user: updatedUsers }));
      res(true);
    } catch (error) {
      console.error("Failed to update user:", error);
      rej(error);
    }
  });
};

export const deleteUser = (id) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const userRef = doc(db, "users", id);
      await deleteDoc(userRef);
      const currentUsers = getState().admin.user || [];
      const updatedUsers = currentUsers.filter(u => u.id !== id);
      dispatch(updateAdminStore({ user: updatedUsers }));
      res(true);
    } catch (error) {
      console.error("Failed to delete user:", error);
      rej(error);
    }
  });
};

export const getUserAndPostGrowthData = (unit = 'month') => async (dispatch, getState) => {
  try {
    const now = new Date();
    let data = [];
    let buckets = [];
    if (unit === 'day') {
      buckets = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() - (6 - i));
        d.setHours(0, 0, 0, 0);
        const start = new Date(d);
        const end = new Date(d);
        end.setHours(23, 59, 59, 999);
        return {
          label: `${d.toLocaleDateString('en-US', { weekday: 'short' })} ${d.getDate()}`,
          start,
          end,
        };
      });
    } else if (unit === 'week') {
      const getWeekNumber = (d) => {
        const firstDay = new Date(d.getFullYear(), 0, 1);
        const pastDays = Math.floor((d - firstDay) / 86400000);
        return Math.ceil((pastDays + firstDay.getDay() + 1) / 7);
      };
      buckets = Array.from({ length: 5 }, (_, i) => {
        const d = new Date(now);
        d.setDate(now.getDate() - 7 * (4 - i));
        const start = new Date(d);
        start.setDate(start.getDate() - start.getDay());
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        const weekNum = getWeekNumber(start);
        return {
          label: `W${weekNum}`,
          start,
          end,
        };
      });
    } else {
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      buckets = Array.from({ length: 12 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
        const start = new Date(d);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setMonth(end.getMonth() + 1);
        end.setDate(end.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        return {
          label: months[start.getMonth()],
          start,
          end,
        };
      });
    }
    const results = await Promise.all(
      buckets.map(async (bucket) => {
        const [usersSnap, postsSnap, adsSnap, sponsoredSnap] = await Promise.all([
          getCountFromServer(query(collection(db, 'users'),
            orderBy('createdAt'),
            where('createdAt', '>=', Timestamp.fromDate(bucket.start)),
            where('createdAt', '<=', Timestamp.fromDate(bucket.end))
          )),
          getCountFromServer(query(collection(db, 'posts'),
            orderBy('createdAt'),
            // @ts-ignore
            where('createdAt', '>=', Timestamp.fromDate(bucket.start)),
            where('createdAt', '<=', Timestamp.fromDate(bucket.end))
          )),
          getCountFromServer(query(collection(db, 'ads'),
            orderBy('createdAt'),
            // @ts-ignore
            where('createdAt', '>=', Timestamp.fromDate(bucket.start)),
            where('createdAt', '<=', Timestamp.fromDate(bucket.end))
          )),
          getCountFromServer(query(collection(db, 'sponsored'),
            orderBy('createdAt'),
            // @ts-ignore
            where('createdAt', '>=', Timestamp.fromDate(bucket.start)),
            where('createdAt', '<=', Timestamp.fromDate(bucket.end))
          )),
        ]);
        return {
          label: bucket.label,
          users: usersSnap.data().count,
          posts: postsSnap.data().count,
          ads: adsSnap.data().count,
          sponsored: sponsoredSnap.data().count,
        };
      })
    );
    return results;
  } catch (err) {
    console.error('Failed to get user and post growth data:', err);
    return [];
  }
};

export const getAllTotals = () => async (dispatch, getState) => {
  try {
    const [usersSnap, postsSnap, adsSnap, sponsoredSnap] = await Promise.all([
      getCountFromServer(query(collection(db, 'users'))),
      getCountFromServer(query(collection(db, 'posts'))),
      getCountFromServer(query(collection(db, 'ads'))),
      getCountFromServer(query(collection(db, 'sponsored'))),
    ]);
    dispatch({
      type: 'UPDATE_ADMIN_STORE',
      payload: {
        totalUser: usersSnap.data().count,
        totalPost: postsSnap.data().count,
        totalAd: adsSnap.data().count,
        totalSponsored: sponsoredSnap.data().count,
      },
    });
    return true;
  } catch (err) {
    console.error('Failed to get all totals:', err);
    return false;
  }
};


