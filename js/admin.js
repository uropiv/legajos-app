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

// 🔎 CARGAR TODOS LOS USUARIOS (no solo pendientes)
async function cargarUsuarios() {
  const snapshot = await getDocs(collection(db, "usuarios"));
  
  let activos = [];
  let pendientes = [];
  let bloqueados = [];

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const usuario = { id: docSnap.id, ...data };

    if (data.estado === "activo") activos.push(usuario);
    if (data.estado === "pendiente") pendientes.push(usuario);
    if (data.estado === "bloqueado") bloqueados.push(usuario);
  });

  lista.innerHTML = `
    <h2>Activos (${activos.length})</h2>
    ${renderUsuarios(activos, "#d4edda")}

    <h2>Pendientes (${pendientes.length})</h2>
    ${renderUsuarios(pendientes, "#fff3cd")}

    <h2>Bloqueados (${bloqueados.length})</h2>
    ${renderUsuarios(bloqueados, "#f8d7da")}
  `;
}

// LISTA CONTEO
function renderUsuarios(arrayUsuarios, colorFondo) {
  if (arrayUsuarios.length === 0) {
    return `<p>No hay usuarios en esta categoría.</p>`;
  }

  return arrayUsuarios.map(user => `
    <div style="background:${colorFondo}; border:1px solid #999; padding:15px; margin-bottom:10px; border-radius:8px;">
      <p><strong>Email:</strong> ${user.email}</p>
      <p><strong>UID:</strong> ${user.id}</p>
      <p><strong>Estado:</strong> ${user.estado}</p>
      <p><strong>Rol:</strong> ${user.rol}</p>
      ${botonesEstado(user.id, user.estado)}
    </div>
  `).join("");
}


// 🎛 BOTONES SEGÚN ESTADO
function botonesEstado(uid, estado) {
  if (estado === "pendiente") {
    return `
      <button onclick="cambiarEstado('${uid}', 'activo')">Activar</button>
      <button onclick="cambiarEstado('${uid}', 'bloqueado')">Bloquear</button>
    `;
  }

  if (estado === "activo") {
    return `
      <button onclick="cambiarEstado('${uid}', 'bloqueado')">Bloquear</button>
    `;
  }

if (estado === "bloqueado") {
  return `
    <button onclick="cambiarEstado('${uid}', 'pendiente')">Enviar a Pendiente</button>
  `;
}


  return "";
}

// 🔄 CAMBIAR ESTADO
window.cambiarEstado = async (uid, nuevoEstado) => {
  console.log("Cambiando estado de", uid, "a", nuevoEstado);

  await updateDoc(doc(db, "usuarios", uid), {
    estado: nuevoEstado
  });

  cargarUsuarios();
};






