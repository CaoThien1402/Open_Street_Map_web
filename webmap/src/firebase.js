// Import các hàm cần thiết
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDB8KWIw79SqCElJ4iSZoxJCzq-n2e_egE",
  authDomain: "webmap-4dd1d.firebaseapp.com",
  projectId: "webmap-4dd1d",
  storageBucket: "webmap-4dd1d.firebasestorage.app",
  messagingSenderId: "552411924542",
  appId: "1:552411924542:web:2504163d3c8cf356d7a96f",
  measurementId: "G-0L50VVLZ60"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Export 'auth' để dùng ở file khác
export { app, analytics, auth, db};