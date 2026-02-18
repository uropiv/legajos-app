import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  collection, 
  getDocs, 
  updateDoc,
  addDoc,
  serverTimestamp
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
      <button onclick="verLegajo('${user.id}')" style="margin-top:10px;">Ver Legajo</button>
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
const DEBUG = false;

window.cambiarEstado = async (uid, nuevoEstado) => {
  if (DEBUG) {
    console.log("Cambiando estado de", uid, "a", nuevoEstado);
  }

  await updateDoc(doc(db, "usuarios", uid), {
    estado: nuevoEstado
  });

  cargarUsuarios();
};

// 👁️ VER LEGAJO DE UN USUARIO
window.verLegajo = async (uidObjetivo) => {
  try {
    const legajoRef = doc(db, "legajos", uidObjetivo);
    const legajoSnap = await getDoc(legajoRef);
    
    if (!legajoSnap.exists()) {
      alert("Este usuario aún no tiene legajo creado.");
      return;
    }

    const data = legajoSnap.data();
    
    // Crear modal para mostrar el legajo
    const modal = document.createElement("div");
    modal.style.position = "fixed";
    modal.style.top = "0";
    modal.style.left = "0";
    modal.style.width = "100%";
    modal.style.height = "100%";
    modal.style.backgroundColor = "rgba(0,0,0,0.7)";
    modal.style.display = "flex";
    modal.style.justifyContent = "center";
    modal.style.alignItems = "center";
    modal.style.zIndex = "9999";
    modal.style.overflowY = "auto";
    modal.id = "modalLegajo";

    const fotoURL = data.fotoPerfilURL || "https://via.placeholder.com/150?text=Foto+de+Perfil";

    modal.innerHTML = `
      <div style="background:white; padding:30px; width:90%; max-width:800px; border-radius:8px; margin:20px;">
        <h2>Legajo del Usuario</h2>
        <div style="text-align:center; margin-bottom:20px;">
          <img src="${fotoURL}" alt="Foto de Perfil" style="width:150px; height:150px; border-radius:50%; border:2px solid #ccc;">
        </div>
        
        <hr>
        <h4>Datos Personales</h4>
        <p><strong>Número de Legajo:</strong> ${data.numeroLegajo || "No especificado"}</p>
        <p><strong>Apellido y Nombre:</strong> ${data.apellidoNombre || "No especificado"}</p>
        <p><strong>Jerarquía:</strong> ${data.jerarquia || "No especificado"}</p>
        <p><strong>Domicilio:</strong> ${data.domicilio || "No especificado"}</p>
        
        <hr>
        <h4>Último Destino</h4>
        <p>${data.ultimoDestino || "No especificado"}</p>
        
        <hr>
        <h4>Situación de Revista</h4>
        <p>${data.situacionRevista || "No especificado"}</p>
        
        <hr>
        <h4>Concepto</h4>
        <p>${data.concepto || "No especificado"}</p>
        
        <hr>
        <h4>Observaciones Admin</h4>
        <p>${data.observacionesAdmin || "No especificado"}</p>
        
        <hr>
        <button id="enviarSugerenciaBtn" style="margin-top:20px; padding:10px 20px; background:#007bff; color:white; border:none; border-radius:5px; cursor:pointer;">Enviar Sugerencia</button>
        <button id="cerrarModalBtn" style="margin-top:20px; margin-left:10px; padding:10px 20px; background:#6c757d; color:white; border:none; border-radius:5px; cursor:pointer;">Cerrar</button>
      </div>
    `;

    document.body.appendChild(modal);

    // Evento del botón Enviar Sugerencia
    document.getElementById("enviarSugerenciaBtn")
      .addEventListener("click", async () => {
        const mensaje = prompt("Escriba la sugerencia para el usuario:");

        if (!mensaje || mensaje.trim() === "") return;

        await enviarSugerencia(uidObjetivo, mensaje.trim());
      });

    // Evento del botón Cerrar
    document.getElementById("cerrarModalBtn")
      .addEventListener("click", () => {
        modal.remove();
      });

    // Cerrar al hacer click fuera del modal
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

  } catch (error) {
    console.error("Error al cargar legajo:", error);
    alert("Error al cargar el legajo del usuario");
  }
};

// 📨 ENVIAR SUGERENCIA AL USUARIO
async function enviarSugerencia(uidObjetivo, mensaje) {
  try {
    await addDoc(collection(db, "legajos", uidObjetivo, "notificaciones"), {
      mensaje: mensaje,
      creadaPorUID: auth.currentUser.uid,
      fecha: serverTimestamp(),
      leida: false
    });

    alert("Sugerencia enviada correctamente");
  } catch (error) {
    console.error("Error al enviar sugerencia:", error);
    alert("Error al enviar la sugerencia");
  }
}



