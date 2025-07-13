import { UPDATE_POST_STORE, UPDATE_ADVERTISE_STORE } from '../types';
import { db, auth, storage } from "../../firebase"
import { doc, getDoc, getDocs, updateDoc, setDoc, addDoc, deleteDoc, arrayUnion, arrayRemove, increment, writeBatch, 
  collection, query, where, limit, serverTimestamp, orderBy, startAfter, getCountFromServer, getDocsFromCache, 
  onSnapshot } from "firebase/firestore";
import { ref as storageRef, uploadString, getDownloadURL, uploadBytes, uploadBytesResumable } from 'firebase/storage'
import { updateUserStore } from './userActions';
import { updateBaseStore } from './baseActions';
import { extractKeywords } from '../../utils';
import { toast } from 'react-toastify';

export const updateAdvertiseStore = (data) => (dispatch, getState) => {
  return new Promise((res, rej) => {
    try {
      dispatch({ type: UPDATE_ADVERTISE_STORE, payload: data });
      res(true);
    } catch (err) {
      console.log('err', err);
      rej(err);
    }
  });
};

export const fetchBannerAdById = (adId) => async (dispatch, getState) => {
  try {
    const docRef = doc(db, 'ads', adId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (err) {
    console.error('Failed to fetch ad:', err);
    return null;
  }
};

export const createOrUpdateBannerAd = ({ stateAdvertise, navigate, setLoading, }) => async (dispatch, getState) => {
  setLoading && setLoading(true);
  try {
    const keywords = extractKeywords(stateAdvertise.name);
    let imageUrl = '';
    
    // Handle image upload
    if (stateAdvertise.imageFile && stateAdvertise.imageFile.startsWith('data:')) {
      let d = new Date();
      let img_name = d.getTime() + '';
      const imageRef = storageRef(storage, `ads/${img_name}`);
      await uploadString(imageRef, stateAdvertise.imageFile, 'data_url');
      imageUrl = await getDownloadURL(imageRef);
    } else {
      imageUrl = stateAdvertise.imageFile;
    }

    // Create the ad document
    const docRef = await addDoc(collection(db, 'ads'), {
      name: stateAdvertise.name,
      email: stateAdvertise.email,
      ownerId: stateAdvertise.ownerId,
      state: 'Pending',
      countryCode: stateAdvertise.countryCode,
      billed: false,
      productLink: stateAdvertise.productLink,
      budget: Number(stateAdvertise.budget),
      days: Number(stateAdvertise.days),
      pubDate: stateAdvertise.pubDate,
      keywords,
      title: stateAdvertise.title,
      imageUrl,
      currency: stateAdvertise.currency,
      businessName: stateAdvertise.businessName,
      createdAt: serverTimestamp(),
    });

    // Log analytics event
    try {
      const { logEvent } = await import('firebase/analytics');
      const { analytics } = await import('../../firebase');
      if (analytics) {
        logEvent(analytics, 'ad_created', {
          ad_type: 'banner',
          ad_id: docRef.id,
          budget: stateAdvertise.budget,
          currency: stateAdvertise.currency,
          country: stateAdvertise.countryCode
        });
      }
    } catch (analyticsError) {
      console.warn('Failed to log analytics event:', analyticsError);
    }

    toast.success('Advertisement was created successfully.');
    setLoading && setLoading(false);
    navigate && navigate(`/payment?id=${docRef.id}&type=ads`);
  } catch (error) {
    console.error('Failed to create banner ad:', error);
    toast.error('Failed to create the advertisement. Please try again.');
    setLoading && setLoading(false);
  }
};

export const fetchSponsoredAdById = (adId) => async (dispatch, getState) => {
  try {
    const docRef = doc(db, 'sponsored', adId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (err) {
    console.error('Failed to fetch sponsored ad:', err);
    return null;
  }
};

export const createOrUpdateSponsoredAd = ({
  editId,
  name,
  title,
  businessName,
  countryCode,
  author,
  link,
  content,
  contentText,
  email,
  phone,
  budget,
  days,
  pubDate,
  currency,
  ownerId,
  navigate,
  setLoading,
  document,
}) => async (dispatch, getState) => {
  setLoading && setLoading(true);
  try {
    // Upload images in content if any (data URLs)
    let updatedContent = content;
    if (document) {
      let images = document.getElementsByTagName('img');
      for (let i = 0; i < images.length; i++) {
        let img_data = images[i].src;
        if (!img_data.startsWith('data:image/')) continue;
        let d = new Date();
        let img_name = d.getTime() + '';
        const imageRef = storageRef(storage, `sponsored-images/${img_name}`);
        await uploadString(imageRef, img_data, 'data_url');
        let url = await getDownloadURL(imageRef);
        updatedContent = updatedContent.replace(images[i].src, url);
      }
    }
    // Extract keywords
    let keywords = [];
    if (contentText) {
      const { extractKeywords } = await import('../../utils');
      keywords = extractKeywords(contentText).concat(extractKeywords(title));
    }
    if (editId) {
      const ref = doc(db, 'sponsored', editId);
      await updateDoc(ref, {
        name,
        title,
        businessName,
        countryCode,
        author,
        link,
        content: updatedContent,
        contentText,
        email,
        phone,
        keywords,
      });
      toast.success('Sponsored content was updated.');
      setLoading && setLoading(false);
      navigate && navigate('/advertise/sponsored');
    } else {
      const docRef = await addDoc(collection(db, 'sponsored'), {
        name,
        title,
        businessName,
        countryCode,
        author,
        link,
        content: updatedContent,
        contentText,
        email,
        ownerId,
        state: 'Pending',
        billed: false,
        budget: Number(budget),
        days: Number(days),
        pubDate,
        keywords,
        phone,
        currency,
        createdAt: serverTimestamp(),
      });
      toast.success('Sponsored content was created.');
      setLoading && setLoading(false);
      navigate && navigate(`/payment?id=${docRef.id}&type=sponsored`);
    }
  } catch (error) {
    console.log(error);
    toast.error('Failed to update sponsored content. Please try again.');
    setLoading && setLoading(false);
  }
};