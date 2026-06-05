import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCp8c93NuVHJ7k7WQ-hUMqCEwnBwfsWYG8",
  authDomain: "studyflow-9d48c.firebaseapp.com",
  projectId: "studyflow-9d48c",
  storageBucket: "studyflow-9d48c.firebasestorage.app",
  messagingSenderId: "931245611410",
  appId: "1:931245611410:web:d0b190325f95664043094b"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
