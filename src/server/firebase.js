import firebase from "firebase";

var firebaseConfig = {
  apiKey: "AIzaSyCGi_rcfN7S3oLlRuz84c5pT8i6ij-y91U",
  databaseURL: "https://blackmeet-default-rtdb.firebaseio.com"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

export const db = firebase;

var firepadRef = firebase.database().ref();

export const userName = prompt("Enter your username:");
const urlparams = new URLSearchParams(window.location.search);
const roomId = urlparams.get("id");

if (roomId) {
  firepadRef = firepadRef.child(roomId);
} else {
  firepadRef = firepadRef.push();
  window.history.replaceState(null, "Meet", "?id=" + firepadRef.key);
}

export default firepadRef;
