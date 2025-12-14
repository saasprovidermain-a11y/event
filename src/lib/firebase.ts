
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  "projectId": "studio-8613077300-bd252",
  "appId": "1:381806406990:web:eb5c056bee08ba93b9c21f",
  "apiKey": "AIzaSyBNlwV2eIWmHgiH0fBvZzhtJKsZwfK2BLs",
  "authDomain": "studio-8613077300-bd252.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "381806406990"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
