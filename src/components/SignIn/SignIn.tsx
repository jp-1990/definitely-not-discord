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
        <br />
        <p>
          <strong>DISCLAIMER:</strong>
          <br />
          This website is not "Discord", or related in any way to the product
          "Discord".
        </p>
        <br />
        <p>
          This website is a personal portfolio project which aims to demonstrate
          a working understanding of WebRTC, and uses styling which closely
          resembles the product "Discord" as a vehicle to achieve this.
        </p>
        <br />
        <p>If you are concerned that this may be a scam then DO NOT log in.</p>
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
