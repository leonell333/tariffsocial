import { UPDATE_POST_STORE, UPDATE_ADVERTISE_STORE } from "../types";
import { db, auth, storage } from "../../firebase";
import { doc, getDoc, getDocs, updateDoc, setDoc, addDoc, deleteDoc, arrayUnion,
  arrayRemove, increment, writeBatch, collection, query, where, limit, serverTimestamp, orderBy,
  startAfter, getCountFromServer, getDocsFromCache, onSnapshot, } from "firebase/firestore";
import { ref as storageRef, uploadString, getDownloadURL, uploadBytes, uploadBytesResumable, } from "firebase/storage";
import { updateUserStore } from "./userActions";
import { updateBaseStore } from "./baseActions";
import { extractKeywords } from "../../utils";
import { toast } from "react-toastify";
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
      const { ownerId, billedStatus, status, keyword } = filters;
      let combined = [];
      const baseConditions = [where("ownerId", "==", ownerId)];

      if (billedStatus === "billed")
        baseConditions.push(where("billed", "==", true));
      if (billedStatus === "not billed")
        baseConditions.push(where("billed", "==", false));
      if (status !== "all") baseConditions.push(where("state", "==", status));

      let keys = extractKeywords(keyword);
      if (keys.length !== 0) {
        for (let k of keys)
          baseConditions.push(where("keywords", "array-contains", k));
      }

      baseConditions.push(orderBy("createdAt", "desc"));

      const [adsSnap, sponsoredSnap] = await Promise.all([
        getDocs(query(collection(db, "ads"), ...baseConditions)),
        getDocs(query(collection(db, "sponsored"), ...baseConditions)),
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
            formatter.formatToParts(1).find((p) => p.type === "currency")
              ?.value || data.currency;

          list.push({
            ...data,
            id: doc_.id,
            type,
            currencySymbol: symbol,
          });
        }

        return list;
      };

      const adsList = await formatDocs(adsSnap, "ads");
      const sponsoredList = await formatDocs(sponsoredSnap, "sponsored");
      combined = [...adsList, ...sponsoredList];
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