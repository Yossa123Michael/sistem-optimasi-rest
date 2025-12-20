import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// GANTI nilai di bawah dengan config dari Firebase Console
const firebaseConfig = {
  apiKey: 'AIzaSyCBvcTmKFTqgm5_v7QOFbvPoCcmESIBiWU',
  authDomain: 'kel4-88f47.firebaseapp.com',
  projectId: 'kel4-88f47',
  storageBucket: 'kel4-88f47.firebasestorage.app',
  messagingSenderId: '167765207574',
  appId: '1:167765207574:web:7a2f732cdba23bbb8f6337',
  //measurementId: "G-VNXS21VLXC"
}

const app = initializeApp(firebaseConfig)

// Auth & Provider Google
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

// Firestore
export const db = getFirestore(app)