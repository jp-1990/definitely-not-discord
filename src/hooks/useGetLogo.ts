import { useState, useEffect } from "react";
import { FirebaseStorage, getDownloadURL, ref } from "@firebase/storage";

interface Args {
  storage: FirebaseStorage;
}
interface Return {
  logo: string;
}

const useGetLogo = ({ storage }: Args): Return => {
  const [logo, setLogo] = useState<string>("");

  useEffect(() => {
    const getLogo = async () => {
      const logoUrl = await getDownloadURL(
        ref(storage, `images/notdiscord.jpg`)
      );
      setLogo(logoUrl);
    };
    getLogo();
  }, []);

  return { logo };
};
export default useGetLogo;
