// js/app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// Konfigurasi dari firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyA2d9uQ_wM0E3iZ8tR6hN4xV1cK7bJ5pL0",
  authDomain: "penilaian-proyek-teater-siswa.firebaseapp.com",
  projectId: "penilaian-proyek-teater-siswa",
  storageBucket: "penilaian-proyek-teater-siswa.firebasestorage.app",
  messagingSenderId: "849201756301",
  appId: "1:849201756301:web:9c8b7a6f5e4d3c2b1a0f9e",
  measurementId: "G-T4E8A7T9E2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, "penilaian-proyek-teater-siswa");

async function loginSistem(identifier, password) {
  let emailToUse = identifier.trim();

  if (!emailToUse.includes("@")) {
    const q = query(
      collection(db, "users"),
      where("username", "==", emailToUse)
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      throw new Error("Username tidak ditemukan di sistem.");
    }
    const userData = snap.docs[0].data();
    if (!userData.email) {
      throw new Error("Akun lama belum terhubung dengan email autentikasi.");
    }
    emailToUse = userData.email;
  }

  const credential = await signInWithEmailAndPassword(auth, emailToUse, password);
  return credential.user;
}

window.SPPPTAuth = {
  app,
  auth,
  db,
  login: loginSistem,
  onAuthStateChanged
};

window.dispatchEvent(new Event("spppt:auth-ready"));
