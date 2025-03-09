// firebase.js

import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, updateDoc, doc } from "firebase/firestore"; // Add missing methods

const firebaseConfig = {
  apiKey: "AIzaSyCv1VSeVQE001xMF62ppHeboaqm0hKtBAc", // Your API key
  projectId: "dig-id", // Your project ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Export Firestore methods
export { db, collection, getDocs, addDoc, deleteDoc, updateDoc, doc };
