import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD7PdZ_hs410aMXTRHnRnL73Y8e0J6vhQw",
  authDomain: "pip-web-tracking.firebaseapp.com",
  projectId: "pip-web-tracking",
  storageBucket: "pip-web-tracking.firebasestorage.app",
  messagingSenderId: "985872600143",
  appId: "1:985872600143:web:d5fdead5a7ec859b622e3a",
  measurementId: "G-6X26HN7B7Z"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
