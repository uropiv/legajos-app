import { auth, db } from "./firebase-config.js";

import { 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  collection,
  getDocs,
  updateDoc,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


// 🔹 CARGAR USUARIOS PENDIENTES
async function cargarUsuarios() {
  const snapshot = await getDocs(collection(db, "usuarios"));
  const lista = document.getElementById("listaPendientes");
  lista.innerHTML = "";

  snapshot.forEach(docSnap => {
    const data = docSnap.data();

    if (data.estado === "pendiente") {
      lista.innerHTML += `
        <div class="card">
          <p>${data.email}</p>
          <button onclick="activar('${docSnap.id}')">Activar</button>
          <button onclick="bloquear('${docSnap.id}')">Bloquear</button>
        </div>
      `;
    }
  });
}


// 🔹 ACTIVAR USUARIO
window.activar = async (uid) => {
  await updateDoc(doc(db, "usuarios", uid), {
    estado: "activo"
  });
  cargarUsuarios();
};


// 🔹 BLOQUEAR USUARIO
window.bloquear = async (uid) => {
  await updateDoc(doc(db, "usuarios", uid), {
    estado: "bloqueado"
  });
  cargarUsuarios();
};


// 🔒 PROTECCIÓN DE ADMIN
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

  // ✅ Si pasa todo, cargar usuarios
  cargarUsuarios();
});


// 🔹 LOGOUT
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "index.html";
});
