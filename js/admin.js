import { db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

window.activar = async (uid) => {
  await updateDoc(doc(db, "usuarios", uid), {
    estado: "activo"
  });
  cargarUsuarios();
};

window.bloquear = async (uid) => {
  await updateDoc(doc(db, "usuarios", uid), {
    estado: "bloqueado"
  });
  cargarUsuarios();
};

cargarUsuarios();
