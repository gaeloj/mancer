import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Configuration from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyCGFbBciv5LMV2LDu1Yj4bg7CdR2wwkq5k",
  authDomain: "feisty-chalice-hnmq3.firebaseapp.com",
  projectId: "feisty-chalice-hnmq3",
  storageBucket: "feisty-chalice-hnmq3.firebasestorage.app",
  messagingSenderId: "933307752804",
  appId: "1:933307752804:web:a4490fdfd7d192c53d1a71"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with the custom database ID provisioned by the platform
const db = getFirestore(app, "ai-studio-sistemadegestode-de823305-7d7f-4d7b-b457-9dc1f36490a8");

export { app, db };
