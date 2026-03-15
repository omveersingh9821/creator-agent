import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB_GqHDtlVDDJcpppvZLbg3y2y-RAaP49E",
  authDomain: "creator-agent-44e09.firebaseapp.com",
  projectId: "creator-agent-44e09",
  storageBucket: "creator-agent-44e09.firebasestorage.app",
  messagingSenderId: "354012525816",
  appId: "1:354012525816:web:21832bbaeef8b35beb770d",
  measurementId: "G-CP7LMPH90S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
