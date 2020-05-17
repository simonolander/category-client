import firebase from "firebase"

const firebaseConfig = {
    apiKey: "AIzaSyC5ce_rmF-DkhmhUBIghNVpcBjF2ul_3sg",
    authDomain: "category-131ad.firebaseapp.com",
    databaseURL: "https://category-131ad.firebaseio.com",
    projectId: "category-131ad",
    storageBucket: "category-131ad.appspot.com",
    messagingSenderId: "497743195440",
    appId: "1:398238074184:web:e5f1741c78b687955c1f7d",
    measurementId: "G-7HW2N6D8BD"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
firebase.analytics();

export default firebase
