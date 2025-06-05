
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCpY8jS4zaWeqJHuSua7-YC8-q1L2RcVKk",
  authDomain: "empresa-fecf1.firebaseapp.com",
  projectId: "empresa-fecf1",
  storageBucket: "empresa-fecf1.firebasestorage.app",
  messagingSenderId: "740825013639",
  appId: "1:740825013639:web:2fa4869b19dfe119ef0722",
  measurementId: "G-Z5SQJMJK12"
};


const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);       

export { db };