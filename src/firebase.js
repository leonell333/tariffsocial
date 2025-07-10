import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const vercel_env = import.meta.env.VITE_VERCEL_ENV;
const firebaseApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const firebaseAuthDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const firebaseProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const firebaseStorageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
const firebaseMessagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
const firebaseAppId = import.meta.env.VITE_FIREBASE_APP_ID;
const firebaseMeasurementId = import.meta.env.VITE_FIREBASE_MEASUREMENT_ID;

const mode = import.meta.env.MODE;
export const storageBucket = firebaseStorageBucket;

const firebaseApp = initializeApp({
  apiKey: firebaseApiKey,
  authDomain: firebaseAuthDomain,
  projectId: firebaseProjectId,
  storageBucket: storageBucket,
  messagingSenderId: firebaseMessagingSenderId,
  appId: firebaseAppId,
  measurementId: firebaseMeasurementId
});

export const app = firebaseApp;

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache()
});

export const auth = getAuth(app);
export const storage = getStorage();

export const emailVerificationUrl =
  mode === "development"
    ? "http://mytariff.com:5173"
    : vercel_env === "preview"
    ? "https://tariff-campaign.vercel.app"
    : "https://tariff-campaign.vercel.app";
