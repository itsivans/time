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

  // Se non scegli data, usa ora (ISO)
  if (!dateTime) dateTime = new Date().toISOString();

  db.collection("activities").add({
    activity: activity,
    tag: tag,
    timestamp: new Date(dateTime).toISOString()
  }).then(() => {
    loadActivities();
    document.getElementById('activity').value = "";
    document.getElementById('dateTime').value = "";
    document.getElementById('tag').selectedIndex = 0;
  });
}

// --- CARICAMENTO E VISUALIZZAZIONE ---
function loadActivities() {
  db.collection("activities").orderBy("timestamp", "desc").limit(100).get().then(snapshot => {
    const tbody = document.getElementById('activityList');
    tbody.innerHTML = "";
    snapshot.forEach(doc => {
      const data = doc.data();
      let d = new Date(data.timestamp);
      // Ottieni data e ora separati, sempre fuso Roma
      let localDate = d.toLocaleDateString('it-IT', { timeZone: 'Europe/Rome' });
      let localTime = d.toLocaleTimeString('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit', second: '2-digit' });
      let tagTxt = data.tag ? data.tag : "Nessun tag";
      let activityTxt = data.activity ? data.activity : "";
      tbody.innerHTML += `<tr>
        <td>${localDate}</td>
        <td>${localTime}</td>
        <td><span class="tag">${tagTxt}</span></td>
        <td>${activityTxt}</td>
        <td class="actions">
          <button onclick="editActivity('${doc.id}', '${activityTxt.replace(/'/g,"&#39;")}', '${data.timestamp}', '${data.tag ? data.tag : ""}')">✏️</button>
          <button onclick="deleteActivity('${doc.id}')">❌</button>
        </td>
      </tr>`;
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
    timestamp: new Date(newDateTime).toISOString(),
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

// --- ESPONI LE FUNZIONI GLOBALI ---
window.addActivity = addActivity;
window.editActivity = editActivity;
window.saveEdit = saveEdit;
window.cancelEdit = cancelEdit;
window.deleteActivity = deleteActivity;
