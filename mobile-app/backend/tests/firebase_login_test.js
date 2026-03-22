import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: "REPLACE-WITH-API-KEY",
  authDomain: "REPLACE-WITH-DOMAIN"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

signInWithEmailAndPassword(auth, "email", "password")
.then(async (userCredential) => {

    const idToken = await userCredential.user.getIdToken();

    console.log("ID TOKEN:", idToken);

});