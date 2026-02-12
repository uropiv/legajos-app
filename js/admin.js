import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  collection, 
  getDocs, 
  updateDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA9ikTNcOy9JsQlYqhxmz_OY_MC4nx3hR8",
  authDomain: "legajos-personales-app.firebaseapp.com",
  projectId: "legajos-personales-app",
  storageBucket: "legajos-personales-app.firebasestorage.app",
  messagingSenderId: "842431832637",
  appId: "1:842431832637:web:544df1edf8c8b43bd94054"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const lista = document.getElementById("listaPendientes");
const logoutBtn = document.getElementById("logoutBtn");

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});

// 🔒 PROTECCIÓN DE ADMIN (versión combinada y más completa)
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const userRef = doc(db, "usuarios", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await signOut(auth);
    window.location.href = "index.html";
    return;
  }

  const data = userSnap.data();

  if (data.rol !== "admin") {
    window.location.href = "dashboard.html";
    return;
  }

  if (data.estado !== "activo") {
    await signOut(auth);
    window.location.href = "index.html";
    return;
  }

  // Solo si pasa todas las validaciones
  cargarUsuarios();
});

async function cargarUsuarios() {
  const snapshot = await getDocs(collection(db, "usuarios"));
  lista.innerHTML = "";

  snapshot.forEach(docSnap => {
    const data = docSnap.data();

    if (data.estado === "pendiente") {
      lista.innerHTML += `
        <div class="card">
          <p>${data.email} - Estado: ${data.estado}</p>
          <button onclick="activar('${docSnap.id}')">Activar</button>
          <button onclick="bloquear('${docSnap.id}')">Bloquear</button>
          <hr>
        </div>
      `;
    }
  });
}

window.activar = async (uid) => {
  await updateDoc(doc(db, "usuarios", uid), {
    estado: "activo"
  });
  alert("Usuario activado");
  cargarUsuarios();
};

window.bloquear = async (uid) => {
  await updateDoc(doc(db, "usuarios", uid), {
    estado: "bloqueado"
  });
  cargarUsuarios();
};
