const firebaseConfig = {
  apiKey: "AIzaSyDEq8aUhdBPcjYM6H6909DldXAdjhRNWbI",
  authDomain: "time-ff7ed.firebaseapp.com",
  projectId: "time-ff7ed",
  storageBucket: "time-ff7ed.appspot.com",
  messagingSenderId: "842285944784",
  appId: "1:842285944784:web:de483548153abc956033d5",
  measurementId: "G-ZR0BNWGVXJ"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

function addActivity() {
  const activity = document.getElementById('activity').value;
  if (!activity) return;

  // Tempo UTC ora
  const dateTimeUTC = new Date().toISOString();

  db.collection("activities").add({
    activity: activity,
    timestamp: dateTimeUTC,
  }).then(() => {
    loadActivities();
    document.getElementById('activity').value = "";
  });
}

function loadActivities() {
  db.collection("activities").orderBy("timestamp", "desc").limit(20).get().then(snapshot => {
    const list = document.getElementById('activityList');
    list.innerHTML = "";
    snapshot.forEach(doc => {
      const data = doc.data();
      // Visualizza in ora di Roma
      const localDate = new Date(data.timestamp).toLocaleString('it-IT', { timeZone: 'Europe/Rome' });
      list.innerHTML += `<li>${localDate}: ${data.activity} <button onclick="deleteActivity('${doc.id}')">X</button></li>`;
    });
  });
}

function deleteActivity(id) {
  db.collection("activities").doc(id).delete().then(loadActivities);
}

// Carica subito la lista
window.onload = loadActivities;
