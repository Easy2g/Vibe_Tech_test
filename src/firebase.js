import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, push, remove } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDIqMHgPjWAboOj-IRLBRhiEoUu6Zj7Mxc",
  authDomain: "vibe-bridge.firebaseapp.com",
  databaseURL: "https://vibe-bridge-default-rtdb.firebaseio.com",
  projectId: "vibe-bridge",
  storageBucket: "vibe-bridge.firebasestorage.app",
  messagingSenderId: "301016044574",
  appId: "1:301016044574:web:d4ba40b4529946478fca0f",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export { ref, set, onValue, push, remove };