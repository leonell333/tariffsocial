import { UPDATE_CHAT_STORE, INITIAL_CHAT_STORE } from "../types";
import { db, auth, storage } from "../../firebase"
import { doc, getDoc, getDocs, updateDoc, setDoc, addDoc, deleteDoc, arrayUnion, arrayRemove, increment, writeBatch, 
  collection, query, where, limit, serverTimestamp, orderBy, startAfter, getCountFromServer, getDocsFromCache, 
  onSnapshot, startAt, endAt, } from "firebase/firestore";
import { ref as storageRef, uploadString, getDownloadURL, uploadBytes, uploadBytesResumable } from 'firebase/storage'
import { updateBaseStore } from "./baseActions";
import { toast } from "react-toastify";

export const initialChatStore = () => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      await dispatch({ type: INITIAL_CHAT_STORE, });
    } catch (err) {
      console.log('err',err);
    }
  })
};

export const updateChatStore = (userData) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      await dispatch({ type: UPDATE_CHAT_STORE, payload: userData });
    } catch (err) {
      console.log('err',err);
    }
  })
};

export const getUsers = (reset = false) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const { chat, user } = getState();
      const { users = [], lastUser, lastUserVisible } = chat;
      if (!user?.id) return res(true);  
      if (lastUserVisible && !reset) return res(true);
      if (reset) {
        dispatch(updateChatStore({
          users: [],
          lastUser: null,
          lastUserVisible: false
        }));
      }
      const conditions = [
        where('__name__', '!=', user.id),
        orderBy('createdAt', 'asc')
      ];
      if (lastUser && !reset) {
        conditions.push(startAfter(lastUser));
      }
      const limitCount = 8;
      conditions.push(limit(limitCount));
      const q = query(collection(db, 'users'), ...conditions);
      const snap = await getDocs(q);
      const newUsers = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      const allUsersFetched = snap.docs.length < limitCount;
      if (newUsers.length > 0) {
        const updatedUsers = reset ? newUsers : [...users, ...newUsers];
        dispatch(updateChatStore({
          users: updatedUsers,
          lastUser: snap.docs[snap.docs.length - 1],
          lastUserVisible: allUsersFetched
        }));
      } else if (allUsersFetched) {
        dispatch(updateChatStore({ lastUserVisible: true }));
      }
      res(true);
    } catch (err) {
      console.error('Failed to load users:', err);
      rej(err);
    }
  });
};

export const getDms = () => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const { user, chat } = getState();
      const { dms = [], lastDms, lastDmsVisible } = chat;
      if (!user?.id) return res(true);
      if (lastDmsVisible) return res(true);
      const dmsRef = collection(db, 'users', user.id, 'dms');
      const conditions = [
        where('state', '==', 'show'),
        orderBy('lastTime', 'desc')
      ];
      if (lastDms) {
        conditions.push(startAfter(lastDms));
      }
      const q = query(dmsRef, ...conditions, limit(10));
      const snap = await getDocs(q);
      const newDms = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      const allFetched = snap.docs.length < 10;
      if (newDms.length > 0) {
        dispatch(updateChatStore({
          dms: [...dms, ...newDms],
          lastDms: snap.docs[snap.docs.length - 1],
          lastDmsVisible: allFetched
        }));
      } else if (allFetched) {
        dispatch(updateChatStore({ lastDmsVisible: true }));
      }
      res(true);
    } catch (err) {
      console.error('Failed to load DMs:', err);
      rej(err);
    }
  });
};

export const getDmsCount = () => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const { user } = getState();
      if (!user?.id) return res(0);
      const dmsRef = collection(db, 'users', user.id, 'dms');
      const countQuery = query(
        dmsRef,
        where('state', '==', 'show')
      );
      const snap = await getCountFromServer(countQuery);
      const count = snap.data().count;
      dispatch(updateChatStore({ dmsCount: count }));
      res(count);
    } catch (err) {
      console.error('Failed to count DMs:', err);
      rej(err);
    }
  });
};

export const getPendingDms = () => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const { user, chat } = getState();
      const { pendingDms = [], lastPendingDms, lastPendingDmsVisible } = chat;
      if (!user?.id) return res(true);
      if (lastPendingDmsVisible) return res(true);
      const dmsRef = collection(db, 'users', user.id, 'dms');
      const conditions = [
        where('state', '==', 'pending'),
        orderBy('lastTime', 'desc')
      ];
      if (lastPendingDms) {
        conditions.push(startAfter(lastPendingDms));
      }
      const q = query(dmsRef, ...conditions, limit(10));
      const snap = await getDocs(q);
      const newPendingDms = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      const allFetched = snap.docs.length < 10;
      if (newPendingDms.length > 0) {
        dispatch(updateChatStore({
          pendingDms: [...pendingDms, ...newPendingDms],
          lastPendingDms: snap.docs[snap.docs.length - 1],
          lastPendingDmsVisible: allFetched
        }));
      } else if (allFetched) {
        dispatch(updateChatStore({ lastPendingDmsVisible: true }));
      }
      res(true);
    } catch (err) {
      console.error('Failed to load pending DMs:', err);
      rej(err);
    }
  });
};

export const getPendingDmsCount = () => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const { user } = getState();
      if (!user?.id) return res(0);
      const dmsRef = collection(db, 'users', user.id, 'dms');
      const countQuery = query(
        dmsRef,
        where('state', '==', 'pending')
      );
      const snap = await getCountFromServer(countQuery);
      const count = snap.data().count;
      dispatch(updateChatStore({ pendingDmsCount: count }));
      res(count);
    } catch (err) {
      console.error('Failed to count pending DMs:', err);
      rej(err);
    }
  });
};

export const getDmState = (partnerId) => async (dispatch, getState) => {
  try {
    const { user } = getState();
    if (!user?.id || !partnerId) return null;
    const dmRef = doc(db, 'users', user.id, 'dms', partnerId);
    const dmSnap = await getDoc(dmRef);
    if (!dmSnap.exists()) return null;
    const data = dmSnap.data();
    return data.state || null;
  } catch (err) {
    console.error("Failed to get DM state:", err);
    return null;
  }
};

export const handleDeleteDM = (dmUserId) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const { user, chat } = getState();
      if (!user?.id || !dmUserId) return res(false);
      dispatch(updateBaseStore({ loading: true }));
      const batch = writeBatch(db);
      const ref1 = doc(db, 'users', user.id, 'dms', dmUserId);
      const ref2 = doc(db, 'users', dmUserId, 'dms', user.id);
      batch.delete(ref1);
      batch.delete(ref2);
      await batch.commit();
      const updatedDms = chat.dms.filter(dm => dm.partnerId !== dmUserId);
      dispatch(updateChatStore({ dms: updatedDms }));
      res(true);
    } catch (err) {
      console.error('Failed to delete DM user from both sides:', err);
      rej(err);
    } finally {
      dispatch(updateBaseStore({ loading: false }));
    }
  });
};

export const handleDmAccept = (dm) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const { user, chat } = getState();
      if (!user?.id || !dm?.partnerId) return res(false);
      const batch = writeBatch(db);
      const ref = doc(db, 'users', user.id, 'dms', dm.partnerId);
      batch.update(ref, {
        state: 'show',
        lastTime: serverTimestamp(),
      });
      await batch.commit();
      const now = new Date();
      const updatedDm = {
        ...dm,
        state: 'show',
        lastTime: now,
      };
      const updatedPendingDms = chat.pendingDms.filter(d => d.partnerId !== dm.partnerId);
      const updatedPendingDmsCount = Math.max(0, chat.pendingDmsCount - 1);
      const updatedDms = [updatedDm, ...chat.dms].sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime));
      await dispatch(updateChatStore({
        dms: updatedDms,
        pendingDms: updatedPendingDms,
        pendingDmsCount: updatedPendingDmsCount,
      }));
      res(true);
    } catch (err) {
      console.error('handleDmAccept error:', err);
      rej(err);
    }
  });
};

export const handleDmBlock = (dm) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const { user, chat } = getState();
      if (!user?.id || !dm?.partnerId) return res(false);
      dispatch(updateBaseStore({ loading: true }));
      const batch = writeBatch(db);
      const ref = doc(db, 'users', user.id, 'dms', dm.partnerId);
      batch.update(ref, {
        state: 'blocked',
        lastTime: serverTimestamp(),
      });
      await batch.commit();
      const now = new Date();
      const updatedDm = {
        ...dm,
        state: 'blocked',
        lastTime: now,
      };
      let updatedDms = [...chat.dms];
      let updatedPendingDms = [...chat.pendingDms];
      let pendingDmsCount = chat.pendingDmsCount;
      if (dm.state === 'pending') {
        updatedPendingDms = updatedPendingDms.filter(d => d.partnerId !== dm.partnerId);
        updatedDms.push(updatedDm);
        pendingDmsCount = Math.max(0, pendingDmsCount - 1);
      } else if (dm.state === 'show') {
        updatedDms = updatedDms.map(dm =>
          dm.partnerId === dm.partnerId ? updatedDm : dm
        );
      }
      updatedDms.sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime));
      await dispatch(updateChatStore({
        dms: updatedDms,
        pendingDms: updatedPendingDms,
        pendingDmsCount,
      }));
      res(true);
    } catch (err) {
      console.error('handleDmBlock error:', err);
      rej(err);
    } finally {
      dispatch(updateBaseStore({ loading: false }));
    }
  });
};

export const handleDmUnblock = (dm) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const { user, chat } = getState();
      if (!user?.id || !dm?.partnerId) return res(false);
      dispatch(updateBaseStore({ loading: true }));
      const batch = writeBatch(db);
      const ref = doc(db, 'users', user.id, 'dms', dm.partnerId);
      batch.update(ref, {
        state: 'show',
        lastTime: serverTimestamp(),
      });
      await batch.commit();
      const now = new Date();
      const updatedDm = {
        ...dm,
        state: 'show',
        lastTime: now,
      };
      let updatedDms = chat.dms.map(dm =>
        dm.partnerId === dm.partnerId ? updatedDm : dm
      );
      updatedDms.sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime));
      await dispatch(updateChatStore({ dms: updatedDms }));
      res(true);
    } catch (err) {
      console.error('handleDmUnblock error:', err);
      rej(err);
    } finally {
      dispatch(updateBaseStore({ loading: false }));
    }
  });
};

export const handleDmIgnore = (dm) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const { user, chat } = getState();
      if (!user?.id || !dm?.partnerId) return res(false);
      dispatch(updateBaseStore({ loading: true }));
      const batch = writeBatch(db);
      const ref = doc(db, 'users', user.id, 'dms', dm.partnerId);
      batch.update(ref, {
        state: 'ignore',
        lastTime: serverTimestamp(),
      });
      await batch.commit();
      const updatedPendingDms = chat.pendingDms.filter(
        d => d.partnerId !== dm.partnerId
      );
      const updatedPendingDmsCount = Math.max(0, chat.pendingDmsCount - 1);
      await dispatch(updateChatStore({
        pendingDms: updatedPendingDms,
        pendingDmsCount: updatedPendingDmsCount,
      }));
      res(true);
    } catch (err) {
      console.error('handleDmIgnore error:', err);
      rej(err);
    } finally {
      dispatch(updateBaseStore({ loading: false }));
    }
  });
};

export const searchUsersByUsername = (input, reset = false) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      if (!input || input.trim() === '') return res([]);
      const { chat, user } = getState();
      const { searchUsers = [], lastSearchUser, lastSearchUserVisible } = chat;
      if (reset) {
        dispatch(updateChatStore({
          searchUsers: [],
          lastSearchUser: null,
          lastSearchUserVisible: false
        }));
      }
      if (lastSearchUserVisible && !reset) return res(searchUsers);
      const searchTerm = input.trim().toLowerCase();
      const usersRef = collection(db, 'users');
      const conditions = [
        where('__name__', '!=', user.id),
        orderBy('username_lowcase'),
        startAt(searchTerm),
        endAt(searchTerm + '\uf8ff'),
        limit(8)
      ];
      if (lastSearchUser && !reset) {
        conditions.push(startAfter(lastSearchUser));
      }
      const q = query(usersRef, ...conditions);
      const snap = await getDocs(q);

      const newSearchUsers = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      const allFetched = snap.docs.length < 8;
      const updatedSearchUsers = reset ? newSearchUsers : [...searchUsers, ...newSearchUsers];
      dispatch(updateChatStore({
        searchUsers: updatedSearchUsers,
        lastSearchUser: snap.docs[snap.docs.length - 1],
        lastSearchUserVisible: allFetched
      }));
      res(true);
    } catch (err) {
      console.error('Failed to search users:', err);
      rej(err);
    }
  });
};

export const getTotalUserCount = (searchTerm = '') => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const { user } = getState();
      if (!user?.id) return res(0);
      const usersRef = collection(db, 'users');
      let conditions = [where('__name__', '!=', user.id)];
      if (searchTerm.trim()) {
        const searchTermLower = searchTerm.trim().toLowerCase();
        conditions.push(
          orderBy('username_lowcase'),
          startAt(searchTermLower),
          endAt(searchTermLower + '\uf8ff')
        );
      }
      const q = query(usersRef, ...conditions);
      const snap = await getCountFromServer(q);
      const count = snap.data().count;
      dispatch(updateChatStore({ totalUserCount: count }));
      res(count);
    } catch (err) {
      console.error('Failed to get total user count:', err);
      rej(err);
    }
  });
};

export const getReverseDmState = (partnerId) => async (dispatch, getState) => {
  try {
    const { user } = getState();
    if (!user?.id || !partnerId) return null;
    const reverseDmRef = doc(db, 'users', partnerId, 'dms', user.id);
    const reverseDmSnap = await getDoc(reverseDmRef);
    if (!reverseDmSnap.exists()) return null;
    const data = reverseDmSnap.data();
    return data.state || null;
  } catch (err) {
    console.error("Failed to get reverse DM state:", err);
    return null;
  }
};

export const checkReverseDmStates = (users) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const { user } = getState();
      if (!user?.id) return res({ blockedUsers: [], newDms: [], existingDms: [], });
      const blockedUsers = [];
      const newDms = [];
      const existingDms = [];
      const dmRefs = users.map(recipient => 
        doc(db, 'users', recipient.id, 'dms', user.id)
      );
      const dmSnaps = await Promise.all(
        dmRefs.map(ref => getDoc(ref))
      );
      users.forEach((recipient, index) => {
        const dmSnap = dmSnaps[index];
        const state = dmSnap.exists() ? dmSnap.data().state : null;
        console.log(`[DM State] ${recipient.username}: ${state}`);
        if (state === 'blocked') {
          blockedUsers.push(recipient);
          toast.warning(`${recipient.username} has blocked you.`);
        } else if (state === null) {
          newDms.push(recipient);
        } else if (state === 'show') {
          toast.success(`DM allowed with ${recipient.username}.`);
          existingDms.push(recipient);
        } else if (state === 'pending') {
          toast.info(`Your DM request to ${recipient.username} is pending.`);
          existingDms.push(recipient);
        }
      });
      res({ blockedUsers, newDms, existingDms, });
    } catch (err) {
      console.error('checkReverseDmStates error:', err);
      rej(err);
    }
  });
};

export const sendMessageWithAttachments = (message, attachments) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const { user } = getState();
      const { selectedUsers = [] } = getState().chat;
      if (selectedUsers.length === 0) {
        toast.warning('No valid recipients to send to.');
        return res(false);
      }
      const { blockedUsers, newDms, existingDms } = await dispatch(checkReverseDmStates(selectedUsers));
      if (blockedUsers.length === selectedUsers.length) {
        toast.warning("Message not sent. All recipients have blocked you.");
        return res(false);
      }
      const isJustEmoji = /^\p{Emoji}+$/u.test(message.trim());
      const allowedUsers = [...newDms, ...existingDms];
      if (message.trim()) {
        await dispatch(sendBulkMessages({
          users: allowedUsers,
          newDms,
          existingDms,
          messageType: isJustEmoji ? 'emoji' : 'text',
          content: message.trim(),
        }));
      }
      if (attachments.length === 0) {
        return res(true);
      }
      const timestamp = Date.now();
      const uploadPromises = attachments.map((a, i) => {
        return new Promise((res, rej) => {
          const path = `messages/${user.id}_${timestamp}_${i}_${a.file.name}`;
          const fileRef = storageRef(storage, path);
          const uploadTask = uploadBytesResumable(fileRef, a.file);
          uploadTask.on(
            'state_changed',
            (snap) => {
              const progress = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
              console.log(`File ${i + 1}: ${progress}%`);
            },
            (error) => {
              console.error(`Upload failed: ${a.file.name}`, error);
              rej(error);
            },
            async () => {
              try {
                const url = await getDownloadURL(fileRef);
                const type = a.type === 'gif' ? 'gif' : a.type === 'image' ? 'image' : 'file';
                res({ url, type });
              } catch (err) {
                console.error('Get URL failed:', err);
                rej(err);
              }
            }
          );
        });
      });
      const results = await Promise.allSettled(uploadPromises);
      const successful = results.filter(r => r.status === 'fulfilled').map(r => r.value);

      if (successful.length > 0) {
        await dispatch(sendBulkMessages({
          users: allowedUsers,
          newDms: [],
          existingDms: allowedUsers,
          messageType: successful[0].type,
          content: successful[0].url,
        }));
      }
      const { chat } = getState();
      const updatedDms = [...chat.dms];
      const latest = successful[successful.length - 1]?.url || message;
      allowedUsers.forEach(u => {
        const index = updatedDms.findIndex(dm => dm.partnerId === u.id);
        const updatedEntry = {
          partnerId: u.id,
          username: u.username || '',
          photoUrl: u.photoUrl || '',
          lastMessage: latest,
          lastTime: new Date(),
          state: 'show',
        };
        if (index !== -1) {
          updatedDms[index] = updatedEntry;
        } else {
          updatedDms.push(updatedEntry);
        }
      });
      updatedDms.sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime));
      dispatch(updateChatStore({ dms: updatedDms }));
      res(true);
    } catch (err) {
      console.error('sendMessageWithAttachments error:', err);
      rej(err);
    }
  });
};

export const sendMessageToSingleUser = (message, attachments) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const { user, chat } = getState();
      const { selectedUserId } = chat;
      if (!selectedUserId) {
        toast.warning('No recipient selected.');
        return res(false);
      }
      const { blocked } = await dispatch(getReverseDmState(selectedUserId));
      if (blocked) {
        toast.error('You have been blocked by this user.');
        return res(false);
      }
      const trimmedMessage = message.trim();
      const isJustEmoji = /^(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|\ud83c[\ude32-\ude3a]|\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff]|\s)+$/;
      if (trimmedMessage) {
        await dispatch(sendMessageOnly({
          to: selectedUserId,
          messageType: isJustEmoji.test(trimmedMessage) ? 'emoji' : 'text',
          content: trimmedMessage,
        }));
      }

      if (!attachments || attachments.length === 0) return res(true);
      const timestamp = Date.now();
      const uploadPromises = attachments.map((a, i) =>
        new Promise((res, reject) => {
          const path = `messages/${user.id}_${timestamp}_${i}_${a.file.name}`;
          const fileRef = storageRef(storage, path);
          const uploadTask = uploadBytesResumable(fileRef, a.file);
          uploadTask.on(
            'state_changed',
            () => {},
            (error) => reject(error),
            async () => {
              try {
                const url = await getDownloadURL(fileRef);
                const type = a.type === 'gif' ? 'gif' : a.type === 'image' ? 'image' : 'file';
                res({ url, type });
              } catch (err) {
                reject(err);
              }
            }
          );
        })
      );
      const results = await Promise.allSettled(uploadPromises);
      const uploaded = results.filter(r => r.status === 'fulfilled').map(r => r.value);
      if (uploaded.length > 0) {
        const batch = writeBatch(db);
        const currentMessages = chat.messages || [];
        const newMessages = [];
        
        uploaded.forEach((upload, index) => {
          const messageRef = doc(collection(db, 'messages'));
          const senderDmRef = doc(db, 'users', user.id, 'dms', selectedUserId);
          const recipientDmRef = doc(db, 'users', selectedUserId, 'dms', user.id);
          
          // Create message object for local state
          const newMessage = {
            id: `temp_${Date.now()}_${index}`, // Temporary ID
            from: user.id,
            to: selectedUserId,
            action: 'send',
            type: 'message',
            message: upload.url,
            messageType: upload.type,
            read: 0,
            timestamp: new Date(),
          };
          newMessages.push(newMessage);
          
          batch.set(messageRef, {
            from: user.id,
            to: selectedUserId,
            action: 'send',
            type: 'message',
            message: upload.url,
            messageType: upload.type,
            read: 0,
            timestamp: serverTimestamp(),
          });
          batch.set(senderDmRef, {
            lastMessage: upload.url,
            lastTime: serverTimestamp(),
          }, { merge: true });
          batch.set(recipientDmRef, {
            lastMessage: upload.url,
            lastTime: serverTimestamp(),
          }, { merge: true });
        });
        
        // Update local messages array immediately
        dispatch(updateChatStore({
          messages: [...currentMessages, ...newMessages]
        }));
        
        await batch.commit();
        
        // Update temporary messages with real Firebase IDs
        const updatedMessages = [...currentMessages, ...newMessages];
        newMessages.forEach((newMessage, index) => {
          const tempMessageIndex = updatedMessages.findIndex(msg => msg.id === newMessage.id);
          if (tempMessageIndex !== -1) {
            updatedMessages[tempMessageIndex] = {
              ...newMessage,
              id: `real_${Date.now()}_${index}`, // In a real implementation, you'd get the actual Firebase ID
              timestamp: new Date(),
            };
          }
        });
        dispatch(updateChatStore({
          messages: updatedMessages
        }));
      }
      res(true);
    } catch (err) {
      console.error('sendMessageToSingleUser error:', err);
      rej(err);
    }
  });
};

export const sendBulkMessages = ({ users, newDms, existingDms, messageType, content }) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const { user } = getState();
      if (!user?.id || !content || users.length === 0) return res(false);
      const batch = writeBatch(db);
      newDms.forEach(recipient => {
        const messageRef = doc(collection(db, 'messages'));
        const senderDmRef = doc(db, 'users', user.id, 'dms', recipient.id);
        const recipientDmRef = doc(db, 'users', recipient.id, 'dms', user.id);
        batch.set(messageRef, {
          from: user.id,
          to: recipient.id,
          action: 'send',
          type: 'DM',
          messageType,
          message: content,
          read: 0,
          timestamp: serverTimestamp(),
        });
        batch.set(senderDmRef, {
          partnerId: recipient.id,
          username: recipient.username || '',
          photoUrl: recipient.photoUrl || '',
          lastMessage: content,
          lastTime: serverTimestamp(),
          state: 'show',
        }, { merge: true });
        batch.set(recipientDmRef, {
          partnerId: user.id,
          email: user.email || '',
          username: user.username || '',
          photoUrl: user.photoUrl || '',
          lastMessage: content,
          lastTime: serverTimestamp(),
          state: 'pending',
        }, { merge: true });
      });

      existingDms.forEach(recipient => {
        const messageRef = doc(collection(db, 'messages'));
        const senderDmRef = doc(db, 'users', user.id, 'dms', recipient.id);
        const recipientDmRef = doc(db, 'users', recipient.id, 'dms', user.id);
        batch.set(messageRef, {
          from: user.id,
          to: recipient.id,
          action: 'send',
          type: 'message',
          message: content,
          messageType,
          read: 0,
          timestamp: serverTimestamp(),
        });
        batch.set(senderDmRef, {
          lastMessage: content,
          lastTime: serverTimestamp(),
        }, { merge: true });
        batch.set(recipientDmRef, {
          lastMessage: content,
          lastTime: serverTimestamp(),
        }, { merge: true });
      });
      await batch.commit();
      res(true);
    } catch (err) {
      console.error('sendBulkMessages error:', err);
      rej(err);
    }
  });
};

export const sendMessageAddDms = ({ to, type, messageType, content }) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const { user, chat } = getState();
      const { dms } = getState().chat;
      if (!user?.id || !to?.id || !content) return res(false);
      
      const isAlreadyInDms = !!dms.find(dm => dm.partnerId === to.id);
      if (isAlreadyInDms) {
        await dispatch(sendMessageOnly({ to: to.id, messageType, content }));
        return res(true);
      }
      
      // Create the message object for local state
      const newMessage = {
        id: `temp_${Date.now()}`, // Temporary ID until Firebase assigns one
        from: user.id,
        to: to.id,
        action: 'send',
        type,
        messageType,
        message: content,
        read: 0,
        timestamp: new Date(), // Use current date for immediate display
      };
      
      // Update local messages array immediately
      const currentMessages = chat.messages || [];
      dispatch(updateChatStore({
        messages: [...currentMessages, newMessage]
      }));
      
      const batch = writeBatch(db);
      const messageRef = doc(collection(db, 'messages'));
      const senderDmRef = doc(db, 'users', user.id, 'dms', to.id);
      const recipientDmRef = doc(db, 'users', to.id, 'dms', user.id);
      
      batch.set(messageRef, {
        from: user.id,
        to: to.id,
        action: 'send',
        type,
        messageType,
        message: content,
        read: 0,
        timestamp: serverTimestamp(),
      });
      batch.set(senderDmRef, {
        partnerId: to.id,
        username: to.username || '',
        photoUrl: to.photoUrl || '',
        lastMessage: content,
        lastTime: serverTimestamp(),
        state: 'show',
      }, { merge: true });
      batch.set(recipientDmRef, {
        partnerId: user.id,
        email: user.email || '',
        username: user.username || '',
        photoUrl: user.photoUrl || '',
        lastMessage: content,
        lastTime: serverTimestamp(),
        state: 'pending',
      }, { merge: true });

      await batch.commit();
      
      // Update the temporary message with the real Firebase ID
      const updatedMessages = [...currentMessages];
      const tempMessageIndex = updatedMessages.findIndex(msg => msg.id === newMessage.id);
      if (tempMessageIndex !== -1) {
        updatedMessages[tempMessageIndex] = {
          ...newMessage,
          id: messageRef.id, // Replace with real Firebase ID
          timestamp: new Date(), // Keep the timestamp for consistency
        };
        dispatch(updateChatStore({
          messages: updatedMessages
        }));
      }
      
      res(true);
    } catch (err) {
      console.error('sendMessageAddDms error:', err);
      rej(err);
    }
  });
};

export const sendMessageOnly = ({ to, messageType, content }) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const { user, chat } = getState();
      if (!user?.id || !to || !content) return res(false);
      const newMessage = {
        id: `temp_${Date.now()}`,
        from: user.id,
        to,
        action: 'send',
        type: 'message',
        message: content,
        messageType,
        read: 0,
        timestamp: new Date(),
      };
      
      const currentMessages = chat.messages || [];
      dispatch(updateChatStore({
        messages: [...currentMessages, newMessage]
      }));
      const batch = writeBatch(db);
      const messageRef = doc(collection(db, 'messages'));
      const senderDmRef = doc(db, 'users', user.id, 'dms', to);
      const recipientDmRef = doc(db, 'users', to, 'dms', user.id);
      batch.set(messageRef, {
        from: user.id,
        to,
        action: 'send',
        type: 'message',
        message: content,
        messageType,
        read: 0,
        timestamp: serverTimestamp(),
      });
      batch.set(senderDmRef, {
        lastMessage: content,
        lastTime: serverTimestamp(),
      }, { merge: true });
      batch.set(recipientDmRef, {
        lastMessage: content,
        lastTime: serverTimestamp(),
      }, { merge: true });
      await batch.commit();
      res(true);
    } catch (err) {
      console.error('sendDirectMessageOnly error:', err);
      rej(err);
    }
  });
};

export const markMessagesAsRead = (fromUserId) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const { user, base } = getState();
      if (!user?.id || !fromUserId) return res(false);
      const q = query(
        collection(db, 'messages'),
        where('from', '==', fromUserId),
        where('to', '==', user.id),
        where('read', '!=', 1)
      );
      const unreadSnap = await getDocs(q);
      if (unreadSnap.docs.length === 0) return res(true);
      const batch = writeBatch(db);
      unreadSnap.docs.forEach((docSnap) => {
        const messageRef = doc(db, 'messages', docSnap.id);
        batch.update(messageRef, { read: 1 });
      });
      await batch.commit();
      const newUnreadCount = Math.max(0, base.unReadMessagesCount - unreadSnap.docs.length);
      dispatch(updateBaseStore({ unReadMessagesCount: newUnreadCount }));
      
      // Update unread counts per user after marking messages as read
      dispatch(getUnreadMessagesCountPerUser());
      
      res(true);
    } catch (err) {
      console.error('Failed to mark messages as read:', err);
      rej(err);
    }
  });
};

export const getMessageHistoryWithUser = (partnerId, reset = true) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const { user, chat } = getState();
      if (!user?.id || !partnerId) return res([]);
      if (reset) {
        dispatch(updateChatStore({
          messages: [],
          lastMessage: null,
          lastMessageVisible: false,
        }));
      }
      const limitCount = 10;
      let baseQuery = [
        where('from', 'in', [user.id, partnerId]),
        where('to', 'in', [user.id, partnerId]),
        where('type', 'in', ['message', 'DM']),
        orderBy('timestamp', 'desc'),
        limit(limitCount),
      ];
      if (!reset && chat.lastMessage && !chat.lastMessageVisible) {
        baseQuery.push(startAfter(chat.lastMessage));
      }
      const snap = await getDocs(query(collection(db, 'messages'), ...baseQuery));
      const newMessages = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).reverse();
      const lastDoc = snap.docs[snap.docs.length - 1] || null;
      const allFetched = snap.docs.length < limitCount;
      dispatch({
        type: UPDATE_CHAT_STORE,
        payload: {
          messages: reset ? newMessages : [...(chat.messages || []), ...newMessages],
          lastMessage: lastDoc,
          lastMessageVisible: allFetched,
        },
      });
      res(newMessages);
    } catch (err) {
      console.error('Error fetching message history:', err);
      rej(err);
    }
  });
};

export const getUnreadMessagesCountPerUser = () => async (dispatch, getState) => {
  const { user, chat } = getState();
  if (!user?.id) return {};
  const messagesRef = collection(db, 'messages');
  const unreadCounts = {};
  const allDmPartners = [
    ...(chat.dms || []).map(dm => dm.partnerId || dm.id),
    ...(chat.pendingDms || []).map(dm => dm.partnerId || dm.id)
  ].filter(Boolean);
  const uniquePartners = [...new Set(allDmPartners)];
  await Promise.all(uniquePartners.map(async (partnerId) => {
    const countQuery = query(
      messagesRef,
      where('to', '==', user.id),
      where('from', '==', partnerId),
      where('read', '==', 0),
      where('type', 'in', ['DM', 'message'])
    );
    const snap = await getCountFromServer(countQuery);
    unreadCounts[partnerId] = snap.data().count;
  }));
  const dmsWithUnread = (chat.dms || []).map(dm => ({
    ...dm,
    unreadCount: unreadCounts[dm.partnerId || dm.id] || 0,
  }));
  const pendingDmsWithUnread = (chat.pendingDms || []).map(dm => ({
    ...dm,
    unreadCount: unreadCounts[dm.partnerId || dm.id] || 0,
  }));
  dispatch(updateChatStore({ 
    dms: dmsWithUnread,
    pendingDms: pendingDmsWithUnread
  }));
  return unreadCounts;
};

export const sendMessageToSelectedUser = (content) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const { user } = getState();
      const selectedUser = user.selectedUser;
      if (!content.trim() || !selectedUser) {
        toast.warning('No content or recipient selected.');
        return res(false);
      }
      const dmState = await dispatch(getReverseDmState(selectedUser.id));
      if (dmState === 'blocked') {
        toast.error('You have been blocked by this user.');
        return res(false);
      }
      if (dmState === null) {
        await dispatch(sendMessageAddDms({
          to: selectedUser,
          type: "DM",
          messageType: "text",
          content: content.trim(),
        }));
      } else {
        await dispatch(sendMessageOnly({
          to: selectedUser.id,
          messageType: "text",
          content: content.trim(),
        }));
      }
      res(true);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message. Please try again.');
      rej(error);
    } finally {
    }
  });
};

export const updateReaction = (messageId, emoji) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const { user, chat } = getState();
      if (!user?.id || !messageId || !emoji) return res(false);
      
      // Update local messages array with reaction
      const currentMessages = chat.messages || [];
      const messageIndex = currentMessages.findIndex(msg => msg.id === messageId);
      
      if (messageIndex !== -1) {
        const message = currentMessages[messageIndex];
        const reactions = message.reactions || [];
        const existingReactionIndex = reactions.findIndex(r => r.userId === user.id && r.emoji === emoji);
        let updatedReactions;
        if (existingReactionIndex !== -1) {
          updatedReactions = reactions.filter((_, index) => index !== existingReactionIndex);
        } else {
          updatedReactions = [...reactions, { userId: user.id, emoji }];
        }
        
        const updatedMessages = [...currentMessages];
        updatedMessages[messageIndex] = {
          ...message,
          reactions: updatedReactions
        };
        
        dispatch(updateChatStore({
          messages: updatedMessages
        }));
        
        const messageRef = doc(db, 'messages', messageId);
        await updateDoc(messageRef, {
          reactions: updatedReactions
        });
      }
      
      res(true);
    } catch (err) {
      console.error('updateReaction error:', err);
      rej(err);
    }
  });
};

export const listenForMessages = (partnerId) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const { user, chat } = getState();
      if (!user?.id || !partnerId) return res(false);
      
      // Create a query for messages between the two users
      const q = query(
        collection(db, 'messages'),
        where('from', 'in', [user.id, partnerId]),
        where('to', 'in', [user.id, partnerId]),
        where('type', 'in', ['message', 'DM']),
        orderBy('timestamp', 'asc')
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const newMessages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        dispatch(updateChatStore({
          messages: newMessages
        }));
      }, (error) => {
        console.error('Error listening for messages:', error);
      });
      res(unsubscribe);
    } catch (err) {
      console.error('listenForMessages error:', err);
      rej(err);
    }
  });
};

export const setReplyToMessage = (message) => (dispatch) => {
  dispatch(updateChatStore({ replyTo: message }));
};

export const pinMessage = (messageId) => async (dispatch, getState) => {
  try {
    const { chat } = getState();
    const currentMessages = chat.messages || [];
    const messageIndex = currentMessages.findIndex(msg => msg.id === messageId);
    if (messageIndex !== -1) {
      const message = currentMessages[messageIndex];
      const newPinnedState = !message.pinned;
      const messageRef = doc(db, 'messages', messageId);
      await updateDoc(messageRef, { pinned: newPinnedState });
      const updatedMessages = currentMessages.map(msg =>
        msg.id === messageId ? { ...msg, pinned: newPinnedState } : msg
      );
      dispatch(updateChatStore({ messages: updatedMessages }));
    }
  } catch (error) {
    console.error('Error toggling pin state:', error);
    throw error;
  }
};

export const copyMessageText = (text) => {
  if (navigator && navigator.clipboard) {
    navigator.clipboard.writeText(text);
  }
};

export const setForwardMessage = (message) => (dispatch) => {
  dispatch(updateChatStore({ forwardMessage: message }));
};

export const deleteMessage = (messageId) => async (dispatch, getState) => {
  await deleteDoc(doc(db, 'messages', messageId));
  const { chat } = getState();
  const updatedMessages = (chat.messages || []).filter(msg => msg.id !== messageId);
  dispatch(updateChatStore({ messages: updatedMessages }));
};

export const toggleSelectMessage = (messageId) => (dispatch, getState) => {
  const { chat } = getState();
  const selected = new Set(chat.selectedMessages || []);
  if (selected.has(messageId)) {
    selected.delete(messageId);
  } else {
    selected.add(messageId);
  }
  dispatch(updateChatStore({ selectedMessages: Array.from(selected) }));
};

export const deleteMessages = (messageIds) => async (dispatch, getState) => {
  const batch = writeBatch(db);
  messageIds.forEach(id => {
    batch.delete(doc(db, 'messages', id));
  });
  await batch.commit();
  const { chat } = getState();
  const updatedMessages = (chat.messages || []).filter(msg => !messageIds.includes(msg.id));
  dispatch(updateChatStore({ messages: updatedMessages, selectedMessages: [] }));
};