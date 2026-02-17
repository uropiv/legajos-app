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

  // Mostrar vista CV por defecto (estilo curriculum vitae)
  mostrarVistaCV(uid);

  // Configurar botones del panel izquierdo
  const botones = panelIzquierdo.querySelectorAll(".btn-seccion");
  botones.forEach(btn => {
    btn.addEventListener("click", () => {
      const seccion = btn.dataset.seccion;
      mostrarSeccion(uid, seccion);
    });
  });
}

// 📄 Mostrar vista CV (curriculum vitae) - inicial por defecto
async function mostrarVistaCV(uid) {
  const legajoRef = doc(db, "legajos", uid);
  const legajoSnap = await getDoc(legajoRef);
  const data = legajoSnap.data();

  // Foto de perfil (placeholder si no existe)
  const fotoURL = data.fotoPerfilURL || "https://via.placeholder.com/150?text=Foto+de+Perfil";

  legajoContainer.innerHTML = `
    <h3>Curriculum Vitae</h3>
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
    <p>${data.concepto || "Solo visible para admin"}</p>
    
    <hr>
    <h4>Observaciones Admin</h4>
    <p>${data.observacionesAdmin || "Solo visible para admin"}</p>
    
    <!-- Futuras secciones: armamento, ascensos, licencias, etc. -->
    <hr>
    <button id="editarBtn">Editar Perfil</button>
  `;

  // Botón para editar (muestra el panel izquierdo)
  const editarBtn = document.getElementById("editarBtn");
  editarBtn.addEventListener("click", () => {
    // Opcional: Ocultar CV y mostrar instrucciones, o simplemente usar los botones del panel
    alert("Usa el panel izquierdo para editar secciones específicas.");
  });
}

// 🔄 Mostrar sección específica (editable)
async function mostrarSeccion(uid, seccion) {
  const legajoRef = doc(db, "legajos", uid);
  const legajoSnap = await getDoc(legajoRef);
  const data = legajoSnap.data();

  switch(seccion) {
case "datosPersonales":
  legajoContainer.innerHTML = `
    <h3>Datos Personales</h3>

    <label>Foto de Perfil:</label><br>
    <input type="file" id="fotoInput" accept="image/*"><br>
    <img id="fotoPreview" 
         src="${data.fotoPerfilURL || "https://via.placeholder.com/150?text=Foto+de+Perfil"}"
         style="width:150px; height:150px; border-radius:50%; margin-top:10px; border:2px solid #ccc;"><br><br>

    <label>Número de Legajo:</label>
    <input type="text" id="numeroLegajo" value="${data.numeroLegajo || ""}" required>

    <label>Apellido y Nombre:</label>
    <input type="text" id="apellidoNombre" value="${data.apellidoNombre || ""}" required>

    <label>Jerarquía:</label>
    <input type="text" id="jerarquia" value="${data.jerarquia || ""}" required>

    <label>Domicilio:</label>
    <input type="text" id="domicilio" value="${data.domicilio || ""}" required>

    <button id="guardarBtn">Guardar Cambios</button>
    <button id="volverCVBtn">Volver al CV</button>
  `;
  break;


    case "ultimoDestino":
      legajoContainer.innerHTML = `
        <h3>Último Destino</h3>
        <label>Último Destino:</label><input type="text" id="ultimoDestino" value="${data.ultimoDestino || ""}" required>
        <button id="guardarBtn">Guardar Cambios</button>
        <button id="volverCVBtn">Volver al CV</button>
      `;
      break;

    case "situacionRevista":
      legajoContainer.innerHTML = `
        <h3>Situación de Revista</h3>
        <label>Situación de Revista:</label><input type="text" id="situacionRevista" value="${data.situacionRevista || ""}" required>
        <button id="guardarBtn">Guardar Cambios</button>
        <button id="volverCVBtn">Volver al CV</button>
      `;
      break;

    case "concepto":
      legajoContainer.innerHTML = `
        <h3>Concepto (Solo Admin)</h3>
        <label>Concepto:</label><input type="text" id="concepto" value="${data.concepto || ""}" readonly>
        <button id="volverCVBtn">Volver al CV</button>
      `;
      break;

    case "observacionesAdmin":
      legajoContainer.innerHTML = `
        <h3>Observaciones Admin (Solo Admin)</h3>
        <label>Observaciones:</label><textarea id="observacionesAdmin" readonly>${data.observacionesAdmin || ""}</textarea>
        <button id="volverCVBtn">Volver al CV</button>
      `;
      break;

    // Futuras secciones: armamento, ascensos, licencias, etc.
    default:
      legajoContainer.innerHTML = `<p>Sección en construcción...</p><button id="volverCVBtn">Volver al CV</button>`;
  }

  // 📷 Subida de foto a Cloudinary
const fotoInput = document.getElementById("fotoInput");

if (fotoInput) {
  fotoInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "legajos_public");

    try {
      const response = await fetch(
        "https://api.cloudinary.com/v1_1/doa7l0ksd/image/upload",
        {
          method: "POST",
          body: formData
        }
      );

      const dataCloud = await response.json();

      // Guardar URL en Firestore
      await updateDoc(doc(db, "legajos", uid), {
        fotoPerfilURL: dataCloud.secure_url
      });

      alert("Foto subida correctamente");
      mostrarSeccion(uid, "datosPersonales"); // refresca vista

    } catch (error) {
      console.error(error);
      alert("Error al subir la imagen");
    }
  });
}


  // Botón volver al CV
  const volverCVBtn = document.getElementById("volverCVBtn");
  if (volverCVBtn) {
    volverCVBtn.addEventListener("click", () => mostrarVistaCV(uid));
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
      mostrarVistaCV(uid); // Regresar al CV después de guardar
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
