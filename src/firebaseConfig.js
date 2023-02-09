import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserSessionPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBZ36k3LxUvAxmdg6drZkooljiHPnsQUW8",
  authDomain: "sistema-control-desechos.firebaseapp.com",
  projectId: "sistema-control-desechos",
  storageBucket: "sistema-control-desechos.appspot.com",
  messagingSenderId: "580462217515",
  appId: "1:580462217515:web:f0f0d8a68d201b2f2add6e"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

auth.languageCode = 'es';

const sessionPersistence = async () => {
  try {
    await setPersistence(auth, browserSessionPersistence);
  } catch (error) {
    console.log(error.code, error.message);
  }
};

sessionPersistence();

export { auth, db, storage };