import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyArqA0bh6CtFtkuWM3qlZiLbu94abtRdUY",
  authDomain: "leaderreps-test.firebaseapp.com",
  projectId: "leaderreps-test",
  storageBucket: "leaderreps-test.firebasestorage.app",
  messagingSenderId: "17544482304",
  appId: "1:17544482304:web:025ac9ec390f74118d52e5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('Usage: node scripts/create-test-user.mjs <email> <password>');
  process.exit(1);
}

console.log(`Attempting to create user: ${email} in project: ${firebaseConfig.projectId}`);

createUserWithEmailAndPassword(auth, email, password)
  .then((userCredential) => {
    console.log('✅ User created successfully!');
    console.log('User ID:', userCredential.user.uid);
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error creating user:', error.code, error.message);
    if (error.code === 'auth/email-already-in-use') {
        console.log('This means the user already exists. You might have the wrong password.');
    }
    process.exit(1);
  });
