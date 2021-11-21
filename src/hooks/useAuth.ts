import { Auth } from "@firebase/auth";
import {
  collection,
  addDoc,
  query,
  doc,
  where,
  getDocs,
  deleteDoc,
  Firestore,
  getDoc,
} from "firebase/firestore";
import { signOut, signInWithPopup, GoogleAuthProvider } from "firebase/auth";

interface Args {
  auth: Auth;
  db: Firestore;
}

const useAuth = ({ auth, db }: Args) => {
  const user = auth.currentUser;

  const handleSignOut = async () => {
    try {
      const userData = auth?.currentUser?.providerData.find(
        (el: Record<string, any>) => el.providerId === "google.com"
      );

      const q = query(
        collection(db, "onlineUsers"),
        where("userId", "==", userData?.uid)
      );
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(async (el) => {
        await deleteDoc(el.ref);
      });

      signOut(auth);
    } catch (err) {
      console.error(
        `something went wrong during sign out (handleSignOut):${err}`
      );
    }
  };

  const handleSignInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const userData = result.user.providerData.find(
        (el: Record<string, any>) => el.providerId === "google.com"
      );
      if (userData?.uid) {
        const existingDocs = await getDocs(
          query(
            collection(db, "onlineUsers"),
            where("userId", "==", userData.uid)
          )
        );
        existingDocs.forEach((el) => deleteDoc(el.ref));
      }
      await addDoc(collection(db, "onlineUsers"), {
        userId: userData?.uid,
        userName: userData?.displayName,
        avatar: userData?.photoURL,
      });
      return true;
    } catch (err) {
      console.error(
        `something went wrong during sign in (handleSignInWithGoogle):${err}`
      );
      return false;
    }
  };

  return {
    user,
    signOut: handleSignOut,
    signInWithGoogle: handleSignInWithGoogle,
  };
};
export default useAuth;
