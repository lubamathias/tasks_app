// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

import {getFirestore} from 'firebase/firestore'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBVep8WmeEo8VYKLsEKnHf6OEWddwWTCP4",
  authDomain: "tarefas-web-b4cfe.firebaseapp.com",
  projectId: "tarefas-web-b4cfe",
  storageBucket: "tarefas-web-b4cfe.appspot.com",
  messagingSenderId: "401189002175",
  appId: "1:401189002175:web:0e45b39be3879b8d489f0a"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);

const db = getFirestore(firebaseApp);

export { db };