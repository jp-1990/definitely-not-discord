import React, { SetStateAction } from "react";
import { FcGoogle } from "react-icons/fc";
import styles from "./SignIn.module.css";

interface Props {
  signInWithGoogle: () => Promise<boolean>;
  setIsAuthenticated: React.Dispatch<SetStateAction<boolean>>;
}

const SignIn: React.FC<Props> = ({ signInWithGoogle, setIsAuthenticated }) => {
  const handleSignIn = async () => {
    const isAuthenticated = await signInWithGoogle();
    setIsAuthenticated(isAuthenticated);
  };
  return (
    <div className={styles.container}>
      <section>
        <h2>Welcome back!</h2>
        <span>Definitely-not-Discord</span>

        <div />
        <p>Preset servers and channels</p>
        <p>Sign in with Google</p>

        <button onClick={handleSignIn}>
          <FcGoogle size="24px" />
          <h3>Sign in with Google</h3>
        </button>
      </section>
    </div>
  );
};

export default SignIn;
