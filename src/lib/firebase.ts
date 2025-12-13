import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBiEJXTeWkiNW02VVzUYxkAZEVRE0L4yXU",
  authDomain: "event-95565.firebaseapp.com",
  projectId: "event-95565",
  storageBucket: "event-95565.appspot.com",
  messagingSenderId: "953933612028",
  appId: "1:953933612028:web:7a1ba8632aead6a3266879",
  measurementId: "G-2CFQVZV3ZD"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
