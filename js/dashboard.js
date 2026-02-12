import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const legajoContainer = document.getElementById("legajoContainer");
const panelIzquierdo = document.getElementById("panelIzquierdo");

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

  if (data.estado !== "activo") {
    alert("Tu cuenta no está activa.");
    await signOut(auth);
    window.location.href = "index.html";
    return;
  }

  if (data.rol === "admin") {
    window.location.href = "admin.html";
    return;
  }

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

  // Mostrar sección por defecto: Datos Personales
  mostrarSeccion(uid, "datosPersonales");

  // Configurar botones del panel izquierdo
  const botones = panelIzquierdo.querySelectorAll(".btn-seccion");
  botones.forEach(btn => {
    btn.addEventListener("click", () => {
      const seccion = btn.dataset.seccion;
      mostrarSeccion(uid, seccion);
    });
  });
}

// 🔄 Mostrar sección específica
async function mostrarSeccion(uid, seccion) {
  const legajoRef = doc(db, "legajos", uid);
  const legajoSnap = await getDoc(legajoRef);
  const data = legajoSnap.data();

  switch(seccion) {
    case "datosPersonales":
      legajoContainer.innerHTML = `
        <h3>Datos Personales</h3>
        <label>Número de Legajo:</label><input type="text" id="numeroLegajo" value="${data.numeroLegajo || ""}" required>
        <label>Apellido y Nombre:</label><input type="text" id="apellidoNombre" value="${data.apellidoNombre || ""}" required>
        <label>Jerarquía:</label><input type="text" id="jerarquia" value="${data.jerarquia || ""}" required>
        <label>Domicilio:</label><input type="text" id="domicilio" value="${data.domicilio || ""}" required>
        <button id="guardarBtn">Guardar Cambios</button>
      `;
      break;

    case "ultimoDestino":
      legajoContainer.innerHTML = `
        <h3>Último Destino</h3>
        <label>Último Destino:</label><input type="text" id="ultimoDestino" value="${data.ultimoDestino || ""}" required>
        <button id="guardarBtn">Guardar Cambios</button>
      `;
      break;

    case "situacionRevista":
      legajoContainer.innerHTML = `
        <h3>Situación de Revista</h3>
        <label>Situación de Revista:</label><input type="text" id="situacionRevista" value="${data.situacionRevista || ""}" required>
        <button id="guardarBtn">Guardar Cambios</button>
      `;
      break;

    case "concepto":
      legajoContainer.innerHTML = `
        <h3>Concepto (Solo Admin)</h3>
        <label>Concepto:</label><input type="text" id="concepto" value="${data.concepto || ""}" readonly>
      `;
      break;

    case "observacionesAdmin":
      legajoContainer.innerHTML = `
        <h3>Observaciones Admin (Solo Admin)</h3>
        <label>Observaciones:</label><textarea id="observacionesAdmin" readonly>${data.observacionesAdmin || ""}</textarea>
      `;
      break;

    // Futuras secciones: armamento, ascensos, licencias, etc.
    default:
      legajoContainer.innerHTML = `<p>Sección en construcción...</p>`;
  }

  // Guardar cambios (si existe botón)
  const guardarBtn = document.getElementById("guardarBtn");
  if (guardarBtn) {
    guardarBtn.addEventListener("click", async () => {
      const actualizaciones = {};
      if (seccion === "datosPersonales") {
        actualizaciones.numeroLegajo = document.getElementById("numeroLegajo").value;
        actualizaciones.apellidoNombre = document.getElementById("apellidoNombre").value;
        actualizaciones.jerarquia = document.getElementById("jerarquia").value;
        actualizaciones.domicilio = document.getElementById("domicilio").value;
      }
      if (seccion === "ultimoDestino") {
        actualizaciones.ultimoDestino = document.getElementById("ultimoDestino").value;
      }
      if (seccion === "situacionRevista") {
        actualizaciones.situacionRevista = document.getElementById("situacionRevista").value;
      }

      await updateDoc(doc(db, "legajos", uid), actualizaciones);
      alert("Sección actualizada correctamente");
    });
  }
}

// 🔓 Botón cerrar sesión
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "index.html";
  });
}
