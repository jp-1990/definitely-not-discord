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
} from "firebase/firestore";
import { signOut, signInWithPopup, GoogleAuthProvider } from "firebase/auth";

interface Args {
  auth: Auth;
  db: Firestore;
}

const useAuth = ({ auth, db }: Args) => {
  const user = auth.currentUser;

  const handleSignOut = async () => {
    const userData = auth?.currentUser?.providerData.find(
      (el: Record<string, any>) => el.providerId === "google.com"
    );

    const q = query(
      collection(db, "onlineUsers"),
      where("userId", "==", userData?.uid)
    );
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((el) => {
      deleteDoc(doc(db, `onlineUsers/${el.id}`));
    });
    signOut(auth);
  };

  const handleSignInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then((result) => {
        const userData = result.user.providerData.find(
          (el: Record<string, any>) => el.providerId === "google.com"
        );
        addDoc(collection(db, "onlineUsers"), {
          userId: userData?.uid,
          userName: userData?.displayName,
          avatar: userData?.photoURL,
        });
      })
      .catch((error) => {
        console.log(error);
      });
  };

  return {
    user,
    signOut: handleSignOut,
    signInWithGoogle: handleSignInWithGoogle,
  };
};
export default useAuth;
