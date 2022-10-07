import firebase from "firebase/app";
import { initializeApp } from "firebase/app";
import { Firestore, getFirestore } from "@firebase/firestore";
import { FirebaseStorage, getStorage } from "@firebase/storage";
import { Auth, getAuth } from "@firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBzBrxzkEpKJGP0B5mu9BweLAxborA9jAU",
  authDomain: "definitely-not-a-popular-app.firebaseapp.com",
  projectId: "definitely-not-a-popular-app",
  storageBucket: "definitely-not-a-popular-app.appspot.com",
  messagingSenderId: "72084038564",
  appId: "1:72084038564:web:0123b66b4aabc625001731",
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore();
const storage = getStorage();

interface Return {
  db: Firestore;
  storage: FirebaseStorage;
  auth: Auth;
}

/**
 * @description provides firestore db, auth and storage instances based on firebase config
 */
const useFirebase = (): Return => {
  return {
    db,
    storage,
    auth,
  };
};
export default useFirebase;
