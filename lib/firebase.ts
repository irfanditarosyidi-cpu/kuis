import { getApp, getApps, initializeApp } from "@firebase/app";
import { getAuth } from "@firebase/auth";
import { getDatabase } from "@firebase/database";

export const firebaseConfig = {
  apiKey: "AIzaSyBEmoYUKMkAUMiX6fJs3DYu8p9C7n7f538",
  authDomain: "tesis-5c7ab.firebaseapp.com",
  databaseURL: "https://tesis-5c7ab-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "tesis-5c7ab",
  storageBucket: "tesis-5c7ab.firebasestorage.app",
  messagingSenderId: "764515455887",
  appId: "1:764515455887:web:caefeac50752f2e86fb1fa",
  measurementId: "G-HTJ9QL6GPG",
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const database = getDatabase(firebaseApp);
