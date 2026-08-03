
import { initializeApp } from "firebase/app";
import { getAuth ,GoogleAuthProvider } from "firebase/auth";
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "terviewiq.firebaseapp.com",
  projectId: "terviewiq",
  storageBucket: "terviewiq.firebasestorage.app",
  messagingSenderId: "195715932846",
  appId: "1:195715932846:web:0b35c653f355ea90ea833f"
};


const app = initializeApp(firebaseConfig); 

const auth=getAuth(app);

const provider = new GoogleAuthProvider();
export {auth,provider};