import { UPDATE_BASE_STORE, } from '../types';
import { db, auth, storage } from "../../firebase"
import { doc, getDoc, getDocs, updateDoc, setDoc, addDoc, deleteDoc, arrayUnion, arrayRemove, increment, writeBatch, 
  collection, query, where, limit, serverTimestamp, orderBy, startAfter, getCountFromServer, getDocsFromCache, 
  onSnapshot, startAt, endAt, } from "firebase/firestore";

export const updateBaseStore = (data) => (dispatch, getState) => {
  return new Promise((res, rej) => {
    try {
      dispatch({ type: UPDATE_BASE_STORE, payload: data });
      res(true);
    } catch (err) {
      console.log('err', err);
      rej(err);
    }
  });
};

export const getTags = () => (dispatch, getState) => {
  return new Promise((res, rej) => {
    const q = query(collection(db, 'tags'), orderBy('frequency', 'desc'));
    getDocs(q)
      .then((snap) => {
        const tags = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        dispatch(updateBaseStore({ tags }));
        res(true);
      })
      .catch((err) => {
        console.error('Failed to load tags:', err);
        rej(err);
      });
  });
};

export const getNotifications = (reset = false) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const { user, base } = getState();
      if (!user?.id) {
        dispatch(updateBaseStore({ notifications: [] }));
        return res([]);
      }
      const { notifications = [], lastNotification, lastNotificationVisible } = base;
      if (reset) {
        dispatch(updateBaseStore({
          notifications: [],
          lastNotification: null,
          lastNotificationVisible: false
        }));
      }
      if (lastNotificationVisible && !reset) {
        return res(notifications);
      }
      const messagesRef = collection(db, 'messages');
      const conditions = [
        where('to', '==', user.id),
        where('type', 'in', ['site', 'notify']),
        orderBy('timestamp', 'desc'),
        limit(8)
      ];
      if (lastNotification && !reset) {
        conditions.push(startAfter(lastNotification));
      }
      const q = query(messagesRef, ...conditions);
      const snapshot = await getDocs(q);
      const newNotifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      const allNotificationsFetched = snapshot.docs.length < 8;
      if (newNotifications.length > 0) {
        const updatedNotifications = reset ? newNotifications : [...notifications, ...newNotifications];
        dispatch(updateBaseStore({
          notifications: updatedNotifications,
          lastNotification: snapshot.docs[snapshot.docs.length - 1],
          lastNotificationVisible: allNotificationsFetched
        }));
      } else if (allNotificationsFetched) {
        dispatch(updateBaseStore({ lastNotificationVisible: true }));
      }
      res(newNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      dispatch(updateBaseStore({ notifications: [] }));
      rej(error);
    }
  });
};

export const markNotificationAsRead = (notificationId) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const messageRef = doc(db, 'messages', notificationId);
      await updateDoc(messageRef, { read: 1 });
      const { base } = getState();
      const updatedNotifications = base.notifications.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: 1 }
          : notification
      );
      const newUnreadCount = Math.max(0, base.unReadNotificationCount - 1);
      dispatch(updateBaseStore({ 
        notifications: updatedNotifications,
        unReadNotificationCount: newUnreadCount
      }));
      res(true);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      rej(error);
    }
  });
};

export const getUnreadCounts = () => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const { user } = getState();
      if (!user?.id) {
        dispatch(updateBaseStore({ 
          unReadNotificationCount: 0,
          unReadMessagesCount: 0 
        }));
        return res({ notifications: 0, messages: 0 });
      }
      const messagesRef = collection(db, 'messages');
      const notificationQuery = query(
        messagesRef,
        where('to', '==', user.id),
        where('read', '==', 0),
        where('type', 'in', ['site', 'notify'])
      );
      const messageQuery = query(
        messagesRef,
        where('to', '==', user.id),
        where('read', '==', 0),
        where('type', 'in', ['DM', 'message'])
      );
      const [notificationSnap, messageSnap] = await Promise.all([
        getCountFromServer(notificationQuery),
        getCountFromServer(messageQuery)
      ]);
      const notificationCount = notificationSnap.data().count;
      const messageCount = messageSnap.data().count;
      dispatch(updateBaseStore({ 
        unReadNotificationCount: notificationCount,
        unReadMessagesCount: messageCount 
      }));
      res(true);
    } catch (err) {
      console.error('Failed to count unread items:', err);
      rej(err);
    }
  });
};

export const deleteNotification = (notificationId) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      if (!notificationId) return;
      const { base } = getState();
      const notificationToDelete = base.notifications.find(
        notification => notification.id === notificationId
      );
      await deleteDoc(doc(db, 'messages', notificationId));
      const updatedNotifications = base.notifications.filter(
        notification => notification.id !== notificationId
      );
      const newLastNotification = updatedNotifications.length > 0 ? updatedNotifications[updatedNotifications.length - 1] : null;
      let newUnreadCount = base.unReadNotificationCount;
      if (notificationToDelete && notificationToDelete.read === 0) {
        newUnreadCount = Math.max(0, newUnreadCount - 1);
      }
      dispatch(updateBaseStore({ 
        notifications: updatedNotifications,
        lastNotification: newLastNotification,
        unReadNotificationCount: newUnreadCount
      }));
      res(true);
    } catch (error) {
      console.error('Error deleting notification:', error);
      rej(error);
    } finally {
    }
  });
};