import React, { useState } from "react";

import App from "./App";
import SignIn from "./components/SignIn";
import { useAuth, useFirebase, useWindowSize } from "./hooks";

const Router = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const { db, auth, storage } = useFirebase();
  const { signInWithGoogle, signOut, user } = useAuth({ db, auth });
  const { dimensions } = useWindowSize();

  const wrappedSignOut = async () => {
    await signOut();
    setIsAuthenticated(false);
  };

  return (
    <div
      className="App"
      style={{ height: dimensions.height, width: dimensions.width }}
    >
      {isAuthenticated && user ? (
        <App
          db={db}
          storage={storage}
          signOut={wrappedSignOut}
          user={user}
          dimensions={dimensions}
        />
      ) : (
        <SignIn
          signInWithGoogle={signInWithGoogle}
          setIsAuthenticated={setIsAuthenticated}
        />
      )}
    </div>
  );
};

export default Router;
