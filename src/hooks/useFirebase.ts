import firebase from "firebase/app";
import { initializeApp } from "firebase/app";
import { Firestore, getFirestore } from "@firebase/firestore";
import { FirebaseStorage, getStorage } from "@firebase/storage";
import { Auth, getAuth } from "@firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAd408UrbbLQ4o2SnLRiplOz6Qdqmp-UiY",
  authDomain: "definitely-not-discord-8bf44.firebaseapp.com",
  projectId: "definitely-not-discord-8bf44",
  storageBucket: "definitely-not-discord-8bf44.appspot.com",
  messagingSenderId: "839946763116",
  appId: "1:839946763116:web:429835f1b1697ecc21d149",
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
