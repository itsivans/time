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

// --- AGGIUNTA ---
function addActivity() {
  const activity = document.getElementById('activity').value.trim();
  const tag = document.getElementById('tag').value;
  let dateTime = document.getElementById('dateTime').value;

  if (!activity) return alert("Inserisci una attività!");

  // Se non scegli data, usa ora
  if (!dateTime) dateTime = new Date().toISOString();

  db.collection("activities").add({
    activity: activity,
    tag: tag,
    timestamp: dateTime
  }).then(() => {
    loadActivities();
    document.getElementById('activity').value = "";
    document.getElementById('dateTime').value = "";
    document.getElementById('tag').selectedIndex = 0;
  });
}

// --- CARICAMENTO E VISUALIZZAZIONE ---
function loadActivities() {
  db.collection("activities").orderBy("timestamp", "desc").limit(50).get().then(snapshot => {
    const list = document.getElementById('activityList');
    list.innerHTML = "";
    snapshot.forEach(doc => {
      const data = doc.data();
      const localDate = new Date(data.timestamp).toLocaleString('it-IT', { timeZone: 'Europe/Rome' });
      list.innerHTML += `<li>
        <span class="tag">${data.tag ? data.tag : "Nessun tag"}</span>
        <strong>${localDate}</strong>: ${data.activity} 
        <button onclick="editActivity('${doc.id}', '${data.activity.replace(/'/g,"&#39;")}', '${data.timestamp}', '${data.tag ? data.tag : ""}')">✏️</button>
        <button onclick="deleteActivity('${doc.id}')">❌</button>
      </li>`;
    });
  });
}

// --- CANCELLA ---
function deleteActivity(id) {
  db.collection("activities").doc(id).delete().then(loadActivities);
}

// --- MODIFICA ---
function editActivity(id, currentActivity, currentTimestamp, currentTag) {
  editId = id;
  document.getElementById('editActivity').value = currentActivity;
  // Se la data manca, metti ora corrente
  document.getElementById('editDateTime').value = currentTimestamp ? currentTimestamp.slice(0,16) : new Date().toISOString().slice(0,16);
  document.getElementById('editTag').value = currentTag || "";
  document.getElementById('editForm').style.display = "block";
}

function saveEdit() {
  const newActivity = document.getElementById('editActivity').value.trim();
  const newDateTime = document.getElementById('editDateTime').value;
  const newTag = document.getElementById('editTag').value;
  if (!newActivity || !newDateTime || !editId) return alert("Compila tutti i campi!");
  db.collection("activities").doc(editId).update({
    activity: newActivity,
    timestamp: newDateTime,
    tag: newTag
  }).then(() => {
    cancelEdit();
    loadActivities();
  });
}

function cancelEdit() {
  editId = null;
  document.getElementById('editActivity').value = "";
  document.getElementById('editDateTime').value = "";
  document.getElementById('editTag').selectedIndex = 0;
  document.getElementById('editForm').style.display = "none";
}

// Precompila il campo data con ora attuale all'avvio (aggiunta)
window.onload = function() {
  loadActivities();
  var now = new Date();
  var tzoffset = now.getTimezoneOffset() * 60000;
  var localISOTime = (new Date(now - tzoffset)).toISOString().slice(0,16);
  document.getElementById('dateTime').value = localISOTime;
};
