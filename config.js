import * as firebase from 'firebase'
require('@firebase/firestore')
var firebaseConfig = {
  apiKey: "AIzaSyD202KWDBP-hzWPwEaoCPbJ9JVFS3veQT8",
  authDomain: "willy-9c32e.firebaseapp.com",
  projectId: "willy-9c32e",
  storageBucket: "willy-9c32e.appspot.com",
  messagingSenderId: "1013338289056",
  appId: "1:1013338289056:web:2e75e2224560c6145f2ac5"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

  export default firebase.firestore()