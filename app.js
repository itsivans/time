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

  // Se non scegli data, usa ora formattata "YYYY-MM-DDTHH:mm"
  if (!dateTime) {
    let now = new Date();
    let tzoffset = now.getTimezoneOffset() * 60000;
    dateTime = (new Date(now - tzoffset)).toISOString().slice(0,16);
  }

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
  db.collection("activities").orderBy("timestamp", "desc").limit(100).get().then(snapshot => {
    const tbody = document.getElementById('activityList');
    tbody.innerHTML = "";
    snapshot.forEach(doc => {
      const data = doc.data();
      let d = new Date(data.timestamp);
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
  document.getElementById('editDateTime').value = currentTimestamp ? currentTimestamp.slice(0,16) : "";
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

  // Imposta la data stats (default oggi)
  let today = new Date().toISOString().slice(0,10);
  document.getElementById('statsDate').value = today;
};

// --- STATISTICHE (tabella + grafico a torta) ---
let statsPieChart = null;

function calcolaPercentualiPerData(dataYYYYMMDD = null) {
  // Se non passi la data, prendi il valore dall'input o OGGI
  if (!dataYYYYMMDD) {
    dataYYYYMMDD = document.getElementById('statsDate').value;
    if (!dataYYYYMMDD) {
      // Default: oggi
      let now = new Date();
      dataYYYYMMDD = now.toISOString().slice(0,10);
      document.getElementById('statsDate').value = dataYYYYMMDD;
    }
  }

  db.collection("activities")
    .where("timestamp", ">=", dataYYYYMMDD + "T00:00")
    .where("timestamp", "<=", dataYYYYMMDD + "T23:59")
    .orderBy("timestamp")
    .get()
    .then(snapshot => {
      let items = [];
      snapshot.forEach(doc => {
        let d = doc.data();
        items.push({
          tag: d.tag || "Nessun tag",
          timestamp: d.timestamp,
          descrizione: d.activity || ""
        });
      });

      if (items.length < 2) {
        document.getElementById('statsResult').innerHTML = "<b>Pochi dati, aggiungi più attività!</b>";
        if (statsPieChart) statsPieChart.destroy();
        return;
      }

      let tempoPerTag = {};
      let totaliMinuti = 0;
      for (let i = 0; i < items.length - 1; i++) {
        let t1 = new Date(items[i].timestamp);
        let t2 = new Date(items[i + 1].timestamp);
        let diffMin = Math.round((t2 - t1) / 60000); // in minuti
        if (diffMin < 0) continue;
        let tag = items[i].tag;
        tempoPerTag[tag] = (tempoPerTag[tag] || 0) + diffMin;
        totaliMinuti += diffMin;
      }

      // Crea tabella HTML
      let risultato = `<b>Statistiche del ${dataYYYYMMDD}</b> (Totale minuti tracciati: <b>${totaliMinuti}</b>)<br><table border="1" cellpadding="4"><tr><th>Tag</th><th>Minuti</th><th>%</th></tr>`;
      Object.entries(tempoPerTag).forEach(([tag, minuti]) => {
        let perc = ((minuti / totaliMinuti) * 100).toFixed(1);
        risultato += `<tr><td>${tag}</td><td>${minuti}</td><td>${perc}%</td></tr>`;
      });
      risultato += "</table>";
      document.getElementById('statsResult').innerHTML = risultato;

      // GRAFICO TORTA
      let ctx = document.getElementById('statsPie').getContext('2d');
      let tags = Object.keys(tempoPerTag);
      let values = Object.values(tempoPerTag);

      if (statsPieChart) statsPieChart.destroy();
      statsPieChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: tags,
          datasets: [{
            data: values,
            backgroundColor: [
              '#7D6CF6','#39C7AA','#F9D923','#F56A79','#6EDCD9','#005792',
              '#FFB6B9','#8EC6C5','#D7BDE2','#F7CAC9','#92A8D1','#FF7E67','#9B59B6'
            ]
          }]
        },
        options: {
          plugins: {
            legend: { display: true, position: 'right' }
          }
        }
      });
    });
}
window.calcolaPercentualiPerData = calcolaPercentualiPerData;

// --- ESPONI LE FUNZIONI GLOBALI ---
window.addActivity = addActivity;
window.editActivity = editActivity;
window.saveEdit = saveEdit;
window.cancelEdit = cancelEdit;
window.deleteActivity = deleteActivity;
