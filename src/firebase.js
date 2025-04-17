import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, getDoc, addDoc, deleteDoc, updateDoc, doc, arrayUnion } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCv1VSeVQE001xMF62ppHeboaqm0hKtBAc", // Your API key
  projectId: "dig-id", // Your project ID
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Export Firestore methods
export { db, collection, getDocs, getDoc, addDoc, deleteDoc, updateDoc, doc, arrayUnion };
