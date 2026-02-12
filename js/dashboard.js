import { auth, db } from "./firebase-config.js";
import { 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { 
  doc, 
  getDoc, 
  setDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const legajoContainer = document.getElementById("legajoContainer");

// 🔐 Validación de sesión y estado
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

  // Bloquear si no está activo
  if (data.estado !== "activo") {
    alert("Tu cuenta no está activa.");
    await signOut(auth);
    window.location.href = "index.html";
    return;
  }

  // Redirigir admin
  if (data.rol === "admin") {
    window.location.href = "admin.html";
    return;
  }

  // 🔥 Si pasa todas las validaciones → cargar legajo
  await inicializarLegajo(user.uid);
});


// 📁 Crear legajo si no existe
async function inicializarLegajo(uid) {
  const legajoRef = doc(db, "legajos", uid);
  const legajoSnap = await getDoc(legajoRef);

  if (!legajoSnap.exists()) {
    await setDoc(legajoRef, {
      numeroLegajo: "",
      apellidoNombre: "",
      jerarquia: "",
      ultimoDestino: "",
      domicilio: "",
      situacionRevista: "",
      fotoPerfilURL: "",
      concepto: "",
      observacionesAdmin: ""
    });
  }

  await cargarLegajo(uid);
}


// 📄 Mostrar legajo
async function cargarLegajo(uid) {
  const legajoRef = doc(db, "legajos", uid);
  const legajoSnap = await getDoc(legajoRef);
  const data = legajoSnap.data();

  legajoContainer.innerHTML = `
    <label>Número de Legajo:</label>
    <input type="text" id="numeroLegajo" value="${data.numeroLegajo || ""}">

    <label>Apellido y Nombre:</label>
    <input type="text" id="apellidoNombre" value="${data.apellidoNombre || ""}">

    <label>Jerarquía:</label>
    <input type="text" id="jerarquia" value="${data.jerarquia || ""}">

    <label>Último Destino:</label>
    <input type="text" id="ultimoDestino" value="${data.ultimoDestino || ""}">

    <label>Domicilio:</label>
    <input type="text" id="domicilio" value="${data.domicilio || ""}">

    <label>Situación de Revista:</label>
    <input type="text" id="situacionRevista" value="${data.situacionRevista || ""}">

    <br><br>
    <button id="guardarBtn">Guardar Cambios</button>
  `;

  document.getElementById("guardarBtn").addEventListener("click", async () => {
    await setDoc(doc(db, "legajos", uid), {
      numeroLegajo: document.getElementById("numeroLegajo").value,
      apellidoNombre: document.getElementById("apellidoNombre").value,
      jerarquia: document.getElementById("jerarquia").value,
      ultimoDestino: document.getElementById("ultimoDestino").value,
      domicilio: document.getElementById("domicilio").value,
      situacionRevista: document.getElementById("situacionRevista").value,
      fotoPerfilURL: data.fotoPerfilURL || "",
      concepto: data.concepto || "",
      observacionesAdmin: data.observacionesAdmin || ""
    });

    alert("Legajo actualizado correctamente");
  });
}


// 🔓 Botón cerrar sesión
const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "index.html";
  });
}
