import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";



const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};


const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'appId'];
const missingKeys = requiredKeys.filter(key => !config[key]);

if (missingKeys.length > 0) {
  throw new Error(`Missing required Firebase environment variables: ${missingKeys.join(', ')}`);
}

const app = initializeApp(config);


let _auth = null;
let _db = null;
let _storage = null;
let _analytics = null;


export { app };
export const storageBucket = config.storageBucket;


export const getFirebaseAuth = () => {
  if (!_auth) {
    _auth = getAuth(app);
  }
  return _auth;
};

export const getFirebaseDb = () => {
  if (!_db) {
    _db = initializeFirestore(app, {
      localCache: persistentLocalCache()
    });
  }
  return _db;
};

export const getFirebaseStorage = () => {
  if (!_storage) {
    _storage = getStorage(app);
  }
  return _storage;
};

export const getFirebaseAnalytics = () => {
  if (!_analytics && config.measurementId && import.meta.env.PROD) {
    _analytics = getAnalytics(app);
  }
  return _analytics;
};

export const auth = getFirebaseAuth();
export const db = getFirebaseDb();
export const storage = getFirebaseStorage();
export const analytics = getFirebaseAnalytics();

export const emailVerificationUrl = (() => {
  if (import.meta.env.MODE === "development") {
    return "http://mytariff.com:5173";
  }
  return "https://tariff-campaign.vercel.app";
})();
