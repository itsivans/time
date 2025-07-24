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

let editId = null;

function addActivity() {
  const activity = document.getElementById('activity').value;
  if (!activity) return;

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
      const localDate = new Date(data.timestamp).toLocaleString('it-IT', { timeZone: 'Europe/Rome' });
      list.innerHTML += `<li>${localDate}: ${data.activity} 
        <button onclick="editActivity('${doc.id}', '${data.activity.replace(/'/g,"&#39;")}')">✏️</button>
        <button onclick="deleteActivity('${doc.id}')">❌</button>
        </li>`;
    });
  });
}

function deleteActivity(id) {
  db.collection("activities").doc(id).delete().then(loadActivities);
}

// --- FUNZIONI DI MODIFICA ---
function editActivity(id, currentActivity) {
  editId = id;
  document.getElementById('editActivity').value = currentActivity;
  document.getElementById('editForm').style.display = "inline";
}

function saveEdit() {
  const newActivity = document.getElementById('editActivity').value;
  if (!newActivity || !editId) return;
  db.collection("activities").doc(editId).update({
    activity: newActivity
  }).then(() => {
    cancelEdit();
    loadActivities();
  });
}

function cancelEdit() {
  editId = null;
  document.getElementById('editActivity').value = "";
  document.getElementById('editForm').style.display = "none";
}

// Carica la lista all'avvio
window.onload = loadActivities;
