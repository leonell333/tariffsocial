
import { UPDATE_POST_STORE, UPDATE_ADVERTISE_STORE } from "../types";
import { db, auth, storage } from "../../firebase";
import { doc, getDoc, getDocs, updateDoc, setDoc, addDoc, deleteDoc, arrayUnion,
  arrayRemove, increment, writeBatch, collection, query, where, limit, serverTimestamp, orderBy,
  startAfter, getCountFromServer, getDocsFromCache, onSnapshot, } from "firebase/firestore";
import { ref as storageRef, uploadString, getDownloadURL, uploadBytes, uploadBytesResumable, } from "firebase/storage";
import { extractKeywords } from "../../utils";
import { logEvent } from "firebase/analytics";
import { analytics } from "../../firebase";

export const updateAdvertiseStore = (data) => (dispatch, getState) => {
  return new Promise((res, rej) => {
    try {
      dispatch({ type: UPDATE_ADVERTISE_STORE, payload: data });
      res(true);
    } catch (err) {
      console.log("err", err);
      rej(err);
    }
  });
};

export const getBannerAdById = (adId) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const docRef = doc(db, "ads", adId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        res({ id: docSnap.id, ...docSnap.data() });
      } else {
        res(null);
      }
    } catch (err) {
      console.error("Failed to get ad:", err);
      rej(err);
    }
  });
};

export const createOrUpdateBannerAd = ({ stateAdvertise }) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const keywords = extractKeywords(stateAdvertise.name);
      let imageUrl = "";
      if (
        stateAdvertise.imageFile &&
        stateAdvertise.imageFile.startsWith("data:")
      ) {
        let d = new Date();
        let img_name = d.getTime() + "";
        const imageRef = storageRef(storage, `ads/${img_name}`);
        await uploadString(imageRef, stateAdvertise.imageFile, "data_url");
        imageUrl = await getDownloadURL(imageRef);
      } else {
        imageUrl = stateAdvertise.imageFile;
      }
      const docRef = await addDoc(collection(db, "ads"), {
        name: stateAdvertise.name,
        email: stateAdvertise.email,
        ownerId: stateAdvertise.ownerId,
        country: stateAdvertise.country,
        productLink: stateAdvertise.productLink,
        budget: Number(stateAdvertise.budget),
        days: Number(stateAdvertise.days),
        pubDate: stateAdvertise.pubDate,
        keywords,
        title: stateAdvertise.title,
        businessName: stateAdvertise.businessName,
        imageUrl,
        currency: stateAdvertise.currency,
        state: "Pending",
        billed: false,
        createdAt: serverTimestamp(),
      });
      console.log('docRef',docRef);
      try {
        if (analytics) {
          logEvent(analytics, "ad_created", {
            ad_type: "banner",
            ad_id: docRef.id,
            budget: stateAdvertise.budget,
            currency: stateAdvertise.currency,
            country: stateAdvertise.country,
          });
        }
      } catch (analyticsError) {
        console.warn("Failed to log analytics event:", analyticsError);
      }
      res(docRef.id);
    } catch (error) {
      console.error("Failed to create banner ad:", error);
      rej(error);
    } finally {
    }
  });
};

export const getSponsoredAdById = (adId) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const docRef = doc(db, "sponsored", adId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        res({ id: docSnap.id, ...docSnap.data() });
      } else {
        res(null);
      }
    } catch (err) {
      console.error("Failed to get sponsored ad:", err);
      rej(err);
    }
  });
};

export const createOrUpdateSponsoredAd = ({ stateSponsored, editId, document }) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      let updatedContent = stateSponsored.content;
      if (document) {
        let images = document.getElementsByTagName("img");
        for (let i = 0; i < images.length; i++) {
          let img_data = images[i].src;
          if (!img_data.startsWith("data:image/")) continue;
          let d = new Date();
          let img_name = d.getTime() + "";
          const imageRef = storageRef(
            storage,
            `sponsored-images/${img_name}`
          );
          await uploadString(imageRef, img_data, "data_url");
          let url = await getDownloadURL(imageRef);
          updatedContent = updatedContent.replace(images[i].src, url);
        }
      }
      let keywords = [];
      if (editId) {
        const ref = doc(db, "sponsored", editId);
        await updateDoc(ref, {
          name: stateSponsored.name,
          title: stateSponsored.title,
          businessName: stateSponsored.businessName,
          country: stateSponsored.country,
          author: stateSponsored.author,
          link: stateSponsored.link,
          content: updatedContent,
          email: stateSponsored.email,
          phone: stateSponsored.phone,
          keywords,
        });
        res(editId);
      } else {
        const docRef = await addDoc(collection(db, "sponsored"), {
          name: stateSponsored.name,
          title: stateSponsored.title,
          businessName: stateSponsored.businessName,
          country: stateSponsored.country,
          author: stateSponsored.author,
          link: stateSponsored.link,
          content: updatedContent,
          email: stateSponsored.email,
          ownerId: stateSponsored.ownerId,
          state: "Pending",
          billed: false,
          budget: Number(stateSponsored.budget),
          days: Number(stateSponsored.days),
          pubDate: stateSponsored.pubDate,
          keywords,
          phone: stateSponsored.phone,
          currency: stateSponsored.currency,
          createdAt: serverTimestamp(),
        });
        try {
          if (analytics) {
            logEvent(analytics, "ad_created", {
              ad_type: "sponsored",
              ad_id: docRef.id,
              budget: stateSponsored.budget,
              currency: stateSponsored.currency,
              country: stateSponsored.country,
            });
          }
        } catch (analyticsError) {
          console.warn("Failed to log analytics event:", analyticsError);
        }
        res(docRef.id);
      }
    } catch (error) {
      console.error("Failed to create/update sponsored ad:", error);
      rej(error);
    }
  });
};

export const handlePaymentSession = (sessionId, adId, ownerId) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const adRef = doc(db, "ads", adId);
      const ad = await getDoc(adRef);
      if (ad.exists()) {
        const ad_ = doc(db, "ads", ad.id);
        await updateDoc(ad_, {
          billed: true,
          billedAt: serverTimestamp(),
          sessionId,
        });
        
        const coll = collection(db, "payments");
        let q = query(coll, where("sessionId", "==", sessionId));
        let snapshot = await getCountFromServer(q);
        if (snapshot.data().count == 0) {
          await addDoc(collection(db, "payments"), {
            adId: adId,
            sessionId,
            ownerId: ownerId,
            createdAt: serverTimestamp(),
          });
        }
        res(true);
      } else {
        res(false);
      }
    } catch (error) {
      console.error("Failed to handle payment session:", error);
      rej(error);
    }
  });
};

export const getCampaigns = (filters) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const { ownerId, billedStatus, status } = filters;
      let adsConditions = [where("ownerId", "==", ownerId)];
      let sponsoredConditions = [where("ownerId", "==", ownerId)];

      if (billedStatus === "billed") {
        adsConditions.push(where("billed", "==", true));
        sponsoredConditions.push(where("billed", "==", true));
      }
      if (billedStatus === "not billed") {
        adsConditions.push(where("billed", "==", false));
        sponsoredConditions.push(where("billed", "==", false));
      }
      if (status !== "all") {
        adsConditions.push(where("state", "==", status));
        sponsoredConditions.push(where("state", "==", status));
      }
      adsConditions.push(orderBy("createdAt", "desc"));
      sponsoredConditions.push(orderBy("createdAt", "desc"));
      const [adsSnap, sponsoredSnap] = await Promise.all([
        getDocs(query(collection(db, "ads"), ...adsConditions)),
        getDocs(query(collection(db, "sponsored"), ...sponsoredConditions)),
      ]);

      const formatDocs = async (snap, type) => {
        const list = [];
        for (const doc_ of snap.docs) {
          const data = doc_.data();
          const formatter = new Intl.NumberFormat("en", {
            style: "currency",
            currency: data.currency,
            currencyDisplay: "symbol",
          });
          const symbol =
            formatter.formatToParts(1).find((p) => p.type === "currency")?.value || data.currency;

          // Normalize country and countryCode for table display
          let country = null;
          let countryCode = null;
          if (type === "ads") {
            country = data.country || null;
            countryCode = data.country && data.country.countryCode ? data.country.countryCode : (data.countryCode || null);
          } else {
            // sponsored
            country = null;
            countryCode = data.countryCode || data.country || null;
          }

          list.push({
            ...data,
            id: doc_.id,
            type,
            currencySymbol: symbol,
            country,
            countryCode,
          });
        }
        return list;
      };

      const adsList = await formatDocs(adsSnap, "ads");
      const sponsoredList = await formatDocs(sponsoredSnap, "sponsored");
      let combined = [...adsList, ...sponsoredList];
      combined.sort((a, b) => {
        const aTime = a.createdAt && a.createdAt.toDate ? a.createdAt.toDate().getTime() : 0;
        const bTime = b.createdAt && b.createdAt.toDate ? b.createdAt.toDate().getTime() : 0;
        return bTime - aTime;
      });
      res(combined);
    } catch (error) {
      console.error("Failed to get campaigns:", error);
      rej(error);
    }
  });
};

export const renewCampaign = (campaignData) => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const { pubDate, days, budget, currency, type, imageFile, ownerId } = campaignData;
      const newDocRef = await addDoc(collection(db, type), {
        ...campaignData,
        ownerId: ownerId,
        pubDate: pubDate,
        days: Number(days),
        budget: Number(budget),
        currency: currency || "USD",
        billed: false,
        state: "Pending",
        createdAt: serverTimestamp(),
      });
      if (imageFile) {
        const imageRef = storageRef(storage, `${type}/${newDocRef.id}`);
        await uploadString(imageRef, imageFile, "data_url");
      }
      res(newDocRef.id);
    } catch (error) {
      console.error("Failed to renew campaign:", error);
      rej(error);
    }
  });
};

export const getBannerAds = () => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const state = getState();
      const userId = state.user.id;
      const { lastBannerAd } = state.advertise;
      let conditions = [
        where("ownerId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(5)
      ];
      if (lastBannerAd) {
        conditions.splice(conditions.length - 1, 0, startAfter(lastBannerAd));
      }
      const adsQuery = query(collection(db, "ads"), ...conditions);
      const snap = await getDocs(adsQuery);
      const ads = [];
      snap.forEach(doc_ => {
        const data = doc_.data();
        const formatter = new Intl.NumberFormat("en", {
          style: "currency",
          currency: data.currency,
          currencyDisplay: "symbol",
        });
        const symbol = formatter.formatToParts(1).find(p => p.type === "currency")?.value || data.currency;
        ads.push({ id: doc_.id, ...data, currencySymbol: symbol });
      });
      const lastDoc = snap.docs[snap.docs.length - 1] || null;
      const lastBannerAdVisible = snap.docs.length < 5;
      dispatch({
        type: UPDATE_ADVERTISE_STORE,
        payload: {
          bannerAds: lastBannerAd ? [...state.advertise.bannerAds, ...ads] : ads,
          lastBannerAd: lastDoc,
          lastBannerAdVisible,
        }
      });
      res({ ads, lastDoc });
    } catch (error) {
      console.error("Failed to get banner ads:", error);
      rej(error);
    }
  });
};

export const getSponsoredAds = () => (dispatch, getState) => {
  return new Promise(async (res, rej) => {
    try {
      const state = getState();
      const userId = state.user.id;
      const { lastSponsoredAd } = state.advertise;
      let conditions = [
        where("ownerId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(5)
      ];
      if (lastSponsoredAd) {
        conditions.splice(conditions.length - 1, 0, startAfter(lastSponsoredAd));
      }
      const sponsoredQuery = query(collection(db, "sponsored"), ...conditions);
      const snap = await getDocs(sponsoredQuery);
      const sponsoredAds = [];
      snap.forEach(doc_ => {
        const data = doc_.data();
        const formatter = new Intl.NumberFormat("en", {
          style: "currency",
          currency: data.currency,
          currencyDisplay: "symbol",
        });
        const symbol = formatter.formatToParts(1).find(p => p.type === "currency")?.value || data.currency;
        sponsoredAds.push({ id: doc_.id, ...data, currencySymbol: symbol });
      });
      const lastDoc = snap.docs[snap.docs.length - 1] || null;
      const lastSponsoredAdVisible = snap.docs.length < 5;
      dispatch({
        type: UPDATE_ADVERTISE_STORE,
        payload: {
          sponsoredAds: lastSponsoredAd ? [...state.advertise.sponsoredAds, ...sponsoredAds] : sponsoredAds,
          lastSponsoredAd: lastDoc,
          lastSponsoredAdVisible,
        }
      });
      res({ sponsoredAds, lastDoc });
    } catch (error) {
      console.error("Failed to get sponsored ads:", error);
      rej(error);
    }
  });
};

export const getPaymentAd = (id, type) => async (dispatch) => {
  try {
    const adRef = doc(db, type, id);
    const adSnap = await getDoc(adRef);
    if (adSnap.exists()) {
      dispatch({
        type: UPDATE_ADVERTISE_STORE,
        payload: { paymentAd: { ...adSnap.data(), id, type } }
      });
    } else {
      dispatch({
        type: UPDATE_ADVERTISE_STORE,
        payload: { paymentAd: null }
      });
    }
  } catch (error) {
    dispatch({
      type: UPDATE_ADVERTISE_STORE,
      payload: { paymentAd: null }
    });
    throw error;
  }
};