import firebase from "firebase"

const firebaseConfig = {
    apiKey: "AIzaSyDBICXl_vQXxzwPZR2mS-9BTOa3qTZLWpw",
    authDomain: "category-23dd5.firebaseapp.com",
    databaseURL: "https://category-23dd5.firebaseio.com",
    projectId: "category-23dd5",
    storageBucket: "category-23dd5.appspot.com",
    messagingSenderId: "497743195440",
    appId: "1:497743195440:web:179167531989bab4632cf5",
    measurementId: "G-7HW2N6D8BD"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
firebase.analytics();

export default firebase
