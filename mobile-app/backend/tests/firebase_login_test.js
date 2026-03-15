import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBz9vwMTGw8g6hVJhLzVlFKh2_IzzZ6F7M",
  authDomain: "nexuscare-3791f.firebaseapp.com"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

signInWithEmailAndPassword(auth, "test99@nexuscare.com", "123456789")
.then(async (userCredential) => {

    const idToken = await userCredential.user.getIdToken();

    console.log("ID TOKEN:", idToken);

});