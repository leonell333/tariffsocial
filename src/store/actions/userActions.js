
import { UPDATE_USER_STORE, SET_ERRORS, CLEAR_ERRORS, LOADING_UI, SET_AUTHENTICATED, 
  SET_UNAUTHENTICATED, LOADING_USER, } from '../types';
import { db, auth, storage, emailVerificationUrl } from "../../firebase"
import { signInWithEmailAndPassword, sendEmailVerification, signInWithPopup, GoogleAuthProvider, updateProfile, 
  signInWithCredential, createUserWithEmailAndPassword, } from 'firebase/auth'
import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import { doc, getDoc, getDocs, updateDoc, setDoc, addDoc, deleteDoc, arrayUnion, arrayRemove, increment, writeBatch, 
  collection, query, where, limit, serverTimestamp, orderBy, startAfter, getCountFromServer, getDocsFromCache, 
  onSnapshot } from "firebase/firestore";
import axios from 'axios';
import { updateBaseStore } from "./baseActions";
import { toast } from 'react-toastify';

export const updateUserStore = (userData) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      await dispatch({ type: UPDATE_USER_STORE, payload: userData });
    } catch (err) {
      console.log('err',err);
    }
  })
};

export const getUserDataById = (userId) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const userRef = doc(db, 'users', userId);
      const docSnap = await getDoc(userRef);
      if (!docSnap.exists()) {
        console.log('No such document!');
        throw new Error('User not found');
      }
      const userData = docSnap.data();
      const currentUserId = getState().user.id;
      if (!currentUserId || userId === currentUserId) {
        dispatch(updateUserStore({ id: userId, ...userData }));
      } else {
        dispatch(updateUserStore({ selectedUser: { id: userId, ...userData } }));
      }
      res(true);
    } catch (err) {
      console.error('Error fetching user data:', err);
      rej(err);
    }
  })
};

export const userInfoSave = (type, value, skillList = [], serviceList = [],) => {
  return (dispatch) => {
    return new Promise(async (res, rej) => {
      dispatch(updateBaseStore({ loading: true }));
      const uid = auth.currentUser?.uid;
      if (!uid) {
        dispatch(updateBaseStore({ loading: false }));
        return rej('User not authenticated');
      }
      try {
        const userDoc = doc(db, 'users', uid);
        let updateData = { [type]: value };
        if (type === 'skills' || type === 'services') {
          const newSkills = type === 'skills' ? value : skillList;
          const newServices = type === 'services' ? value : serviceList;
          const tags = [...new Set([...newSkills, ...newServices])];
          updateData.tags = tags;
        }
        if (type === 'username') {
          updateData.username_lowcase = value.toLowerCase();
        }
        await updateDoc(userDoc, updateData);
        dispatch(updateUserStore({ ...updateData }))
        res(true);
      } catch (err) {
        console.error('Error updating user:', err);
        rej(err);
      } finally {
        dispatch(updateBaseStore({ loading: false }));
      }
    });
  };
};

export const uploadUserAvatar = (file) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const { id, } = getState().user
      if (!file || !id) return
      dispatch(updateBaseStore({ loading: true }));
      const imageRef = storageRef(storage, `profile/${id}`);
      await uploadBytes(imageRef, file);
      const url = await getDownloadURL(imageRef);
      const userRef = doc(db, "users", id);
      await updateDoc(userRef, { photoUrl: url });
      dispatch(updateBaseStore({ loading: false }));
      dispatch(updateUserStore({ photoUrl: url, photo: 0 }));
      toast.success("Profile photo updated successfully!");
      res(true);
    } catch (err) {
      toast.error("Failed to upload profile photo.");
      rej(err);
    }
  });
};

export const deleteUserAvatar = () => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    const { user } = getState();
    try {
      dispatch(updateBaseStore({ loading: true }));
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, { photoUrl: '' });
      dispatch(updateUserStore({ photoUrl: '', photo: 0 }))
      res(true);
    } catch (err) {
      console.error("Failed to delete avatar:", err);
      rej(err);
    } finally {
      dispatch(updateBaseStore({ loading: false }));
    }
  });
};

export const getTotalUsersCount = () => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const currentUserId = getState().user.id;
      const usersRef = collection(db, 'users');
      const totalSnapshot = await getCountFromServer(usersRef);
      const totalUsers = totalSnapshot.data().count;
      const usersCount = currentUserId ? totalUsers - 1 : totalUsers;
      res(usersCount);
    } catch (err) {
      console.error('Error getting total users count:', err);
      rej(err);
    }
  });
};

// auth
export const signIn = (email, password) => (dispatch) => {
  return new Promise(async (res, rej) => {
    dispatch(updateBaseStore({ loading: true }));
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      if (!user.emailVerified) {
        await sendEmailVerification(user, { url: emailVerificationUrl });
        toast.warn('Your email is not verified. We just sent a new link to your inbox.', { position: 'top-right' });
        rej('Email is not verified');
        return;
      }

      await dispatch(getUserDataById(user.uid));
      toast.success(`Welcome ${user.username || 'you'}!`, { position: 'top-right' });
      res(true);
    } catch (error) {
      const code = error.code || '';
      const map = {
        'auth/invalid-email': 'Invalid email format.',
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/invalid-credential': 'Invalid credentials. Please check your input.',
        'auth/user-disabled': 'This account has been disabled.',
        'auth/too-many-requests': 'Too many attempts. Try again later.',
      };
      toast.error(map[code] || `Login failed: ${error.message}`, { position: 'top-right' });
      rej(error.message);
    } finally {
      dispatch(updateBaseStore({ loading: false }));
    }
  });
};

export const signUp = (email, password, userName) => (dispatch) => {
  return new Promise(async (res, rej) => {
    dispatch(updateBaseStore({ loading: true }));
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await Promise.all([
        updateProfile(user, { displayName: userName }),
        sendEmailVerification(user, { url: emailVerificationUrl }),
        setDoc(doc(db, 'users', user.uid), {
          username: userName,
          username_lowcase: userName.toLowerCase(),
          email: user.email,
          photoUrl: '',
          country: '',
          information: '',
          description: '',
          skills: [],
          services: [],
          tags: [],
          followCount: 0,
          follows: [],
          followerCount: 0,
          postCount: 0,
          adCount: 0,
          sponsoreCount: 0,
          status: 'offline',
          isVerified: false,
          role: { admin: false, moderator: false },
          createdAt: serverTimestamp(),
        }),
      ]);
      res(true);
    } catch (error) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          toast.error('This email is already registered. Try logging in.', { position: 'top-right' });
          break;
        case 'auth/invalid-email':
          toast.error('Please enter a valid email address.', { position: 'top-right' });
          break;
        case 'auth/weak-password':
          toast.error('Password is too weak. Use at least 6 characters.', { position: 'top-right' });
          break;
        case 'auth/operation-not-allowed':
          toast.error('Sign up is not enabled. Please contact support.', { position: 'top-right' });
          break;
        case 'auth/too-many-requests':
          toast.error('Too many failed attempts. Try again later.', { position: 'top-right' });
          break;
        default:
          toast.error(`Sign up failed: ${error.message}`, { position: 'top-right' });
      }
      rej(error.message);
    } finally {
      dispatch(updateBaseStore({ loading: false }));
    }
  });
};

const provider = new GoogleAuthProvider();
export const googleLogin = () => async (dispatch) => {
  return new Promise(async (res, rej) => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userRef);
      let userData;

      if (!docSnap.exists()) {
        const username = user.displayName || user.email.split('@')[0];
        userData = {
          username: username,
          username_lowcase: username.toLowerCase(),
          email: user.email,
          photoUrl: user.photoURL || '',
          status: 'online',
          countryCode: '',
          description: '',
          information: '',
          skills: [],
          services: [],
          tags: [],
          followCount: 0,
          follows: [],
          followerCount: 0,
          postCount: 0,
          adCount: 0,
          sponsoreCount: 0,
          role: { admin: false, moderator: false },
          isVerified: user.emailVerified,
          createdAt: serverTimestamp(),
        };
        await setDoc(userRef, userData);
      } else {
        userData = { ...docSnap.data() };
      }
      dispatch(updateUserStore({ id: user.uid, ...userData }));
      toast.success(`Welcome ${user.displayName || 'you'}!`, { position: 'top-right' });
      res(true);
    } catch (err) {
      toast.error('Google sign-in failed: ' + err.message, { position: 'top-right' });
      rej(err.message);
    }
  });
};

export const signOut = () => async (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      await Promise.all([
        auth.signOut(),
        dispatch({ type: SET_UNAUTHENTICATED })
      ]);
      res(true);
    } catch (err) {
      console.log('err', err);
      rej(err);
    }
  });
};

const setAuthorizationHeader = (token) => {
  const FBIdToken = `Bearer ${token}`;
  localStorage.setItem('FBIdToken', FBIdToken);
  axios.defaults.headers.common['Authorization'] = FBIdToken;
};
