import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBz9vwMTGw8g6hVJhLzVlFKh2_IzzZ6F7M",
  authDomain: "nexuscare-3791f.firebaseapp.com",
  projectId: "nexuscare-3791f",
  storageBucket: "nexuscare-3791f.firebasestorage.app",
  messagingSenderId: "48714113440",
  appId: "1:48714113440:web:6435e1779ade86852f04c5",
  measurementId: "G-WJCYVLFWBX"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);