import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Configuration from user's google-services.json (Project: union-cfb07)
const firebaseConfig = {
  apiKey: "AIzaSyA_f9RN52wXUCaFFknAqGTrtLtTF2UsmXA",
  authDomain: "union-cfb07.firebaseapp.com",
  projectId: "union-cfb07",
  storageBucket: "union-cfb07.firebasestorage.app",
  messagingSenderId: "198156295694",
  appId: "1:198156295694:android:2eb8f8e67b49d7ef3ca65f"
};

const app = initializeApp(firebaseConfig);

// Initialize default Firestore database shared with the Android APK (com.gaeloj.union)
const db = getFirestore(app);

export { app, db };
