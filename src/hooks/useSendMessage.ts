import { User } from "@firebase/auth";
import { addDoc, collection, Firestore } from "@firebase/firestore";

interface MessageType {
  id: string;
  userId: string;
  userName: string;
  avatar?: string;
  date: string;
  message: string;
  channel: string;
}

interface ServerState {
  id: string;
  name: string;
}
interface ChannelState extends ServerState {
  server: string;
}

interface Args {
  server: ServerState | undefined;
  textChannel: ChannelState | undefined;
  user: User | null;
  db: Firestore;
}

const useSendMessage = ({ server, textChannel, user, db }: Args) => {
  const addMessage = async (path: string, data: Omit<MessageType, "id">) => {
    await addDoc(collection(db, path), data);
  };

  const sendMessage = (message: string) => {
    const userData = user?.providerData.find(
      (el: Record<string, any>) => el.providerId === "google.com"
    );
    if (!userData) return;

    addMessage(`servers/${server?.id}/channels/${textChannel?.id}/messages`, {
      userId: userData.uid,
      userName: userData.displayName || "",
      date: `${Date.now()}`,
      message: message,
      avatar: userData.photoURL || "",
      channel: textChannel?.id || "",
    });
  };

  return {
    sendMessage,
  };
};
export default useSendMessage;
