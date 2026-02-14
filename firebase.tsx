
import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  increment,
  onSnapshot,
  orderBy,
  arrayUnion,
  arrayRemove
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDeOr0PbY930XoG7nn1ye5vDxeCtbvNBlo",
  authDomain: "bihon-7d8dc.firebaseapp.com",
  projectId: "bihon-7d8dc",
  storageBucket: "bihon-7d8dc.firebasestorage.app",
  messagingSenderId: "1087532876213",
  appId: "1:1087532876213:web:408441ed6042160056d9fc"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Exporting necessary Firestore functionality for the application
export { 
  db, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  increment,
  onSnapshot,
  orderBy,
  arrayUnion,
  arrayRemove
};
