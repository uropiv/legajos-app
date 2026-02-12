import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA9ikTNcOy9JsQlYqhxmz_OY_MC4nx3hR8",
  authDomain: "legajos-personales-app.firebaseapp.com",
  projectId: "legajos-personales-app",
  storageBucket: "legajos-personales-app.firebasestorage.app",
  messagingSenderId: "842431832637",
  appId: "1:842431832637:web:544df1edf8c8b43bd94054"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
