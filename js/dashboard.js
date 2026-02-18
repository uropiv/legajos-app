import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where,
  orderBy, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 🔒 Función para escapar HTML y prevenir XSS
function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Esperar a que el DOM esté listo
let legajoContainer, panelIzquierdo;

document.addEventListener("DOMContentLoaded", () => {
  legajoContainer = document.getElementById("legajoContainer");
  panelIzquierdo = document.getElementById("panelIzquierdo");

  // Verificar que los elementos existan
  if (!legajoContainer || !panelIzquierdo) {
    console.error("Error: legajoContainer o panelIzquierdo no encontrados en el DOM");
    return;
  }

  // Configurar botón cerrar sesión
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await signOut(auth);
      window.location.href = "index.html";
    });
  }

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
  const rolUsuario = data.rol;

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

  await inicializarLegajo(user.uid, rolUsuario);
  await verificarNotificaciones(user.uid);
  });
});

// 📁 Crear legajo si no existe
async function inicializarLegajo(uid, rolUsuario) {
  if (!legajoContainer || !panelIzquierdo) {
    console.error("Error: legajoContainer o panelIzquierdo no están disponibles");
    return;
  }

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

    // 🔥 Registrar creación
    await addDoc(collection(db, "legajos", uid, "historial"), {
      tipo: "creacion",
      campo: "legajo",
      valorAnterior: "",
      valorNuevo: "Legajo creado",
      modificadoPorUID: uid,
      rol: rolUsuario,
      fecha: serverTimestamp()
    });
  }

  // Mostrar vista CV por defecto (estilo curriculum vitae)
  mostrarVistaCV(uid, rolUsuario);

  // Configurar botones del panel izquierdo
  const botones = panelIzquierdo.querySelectorAll(".btn-seccion");
  botones.forEach(btn => {
    btn.addEventListener("click", () => {
      const seccion = btn.dataset.seccion;
      mostrarSeccion(uid, seccion, rolUsuario);
    });
  });
}

// 📄 Mostrar vista CV (curriculum vitae) - inicial por defecto
async function mostrarVistaCV(uid, rolUsuario) {
  if (!legajoContainer) {
    console.error("Error: legajoContainer no está disponible");
    return;
  }

  const legajoRef = doc(db, "legajos", uid);
  const legajoSnap = await getDoc(legajoRef);
  const data = legajoSnap.data();

  // Foto de perfil (placeholder si no existe) - escapar URL para prevenir XSS
  const fotoURL = escapeHtml(data.fotoPerfilURL || "https://via.placeholder.com/150?text=Foto+de+Perfil");

  legajoContainer.innerHTML = `
    <h3>Curriculum Vitae</h3>
    <div style="text-align:center; margin-bottom:20px;">
      <img src="${fotoURL}" alt="Foto de Perfil" style="width:150px; height:150px; border-radius:50%; border:2px solid #ccc;">
    </div>
    
    <hr>
    <h4>Datos Personales</h4>
    <p><strong>Número de Legajo:</strong> ${escapeHtml(data.numeroLegajo || "No especificado")}</p>
    <p><strong>Apellido y Nombre:</strong> ${escapeHtml(data.apellidoNombre || "No especificado")}</p>
    <p><strong>Jerarquía:</strong> ${escapeHtml(data.jerarquia || "No especificado")}</p>
    <p><strong>Domicilio:</strong> ${escapeHtml(data.domicilio || "No especificado")}</p>
    
    <hr>
    <h4>Último Destino</h4>
    <p>${escapeHtml(data.ultimoDestino || "No especificado")}</p>
    
    <hr>
    <h4>Situación de Revista</h4>
    <p>${escapeHtml(data.situacionRevista || "No especificado")}</p>
    
    <hr>
    <h4>Concepto</h4>
    <p>${escapeHtml(data.concepto || "Solo visible para admin")}</p>
    
    <hr>
    <h4>Observaciones Admin</h4>
    <p>${escapeHtml(data.observacionesAdmin || "Solo visible para admin")}</p>
    
    <!-- Futuras secciones: armamento, ascensos, licencias, etc. -->
    <hr>
    <button id="editarBtn">Editar Perfil</button>
    <button id="verHistorialBtn">Ver Historial</button>
  `;

  // Botón para editar (muestra el panel izquierdo)
  const editarBtn = document.getElementById("editarBtn");
  if (editarBtn) {
    editarBtn.addEventListener("click", () => {
      // Opcional: Ocultar CV y mostrar instrucciones, o simplemente usar los botones del panel
      alert("Usa el panel izquierdo para editar secciones específicas.");
    });
  }

  const verHistorialBtn = document.getElementById("verHistorialBtn");
  if (verHistorialBtn) {
    verHistorialBtn.addEventListener("click", () => {
      mostrarHistorial(uid, rolUsuario);
    });
  }
}

// 🔄 Mostrar sección específica (editable)
async function mostrarSeccion(uid, seccion, rolUsuario) {
  if (!legajoContainer) {
    console.error("Error: legajoContainer no está disponible");
    return;
  }

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
             src="${escapeHtml(data.fotoPerfilURL || "https://via.placeholder.com/150?text=Foto+de+Perfil")}"
             style="width:150px; height:150px; border-radius:50%; margin-top:10px; border:2px solid #ccc;"><br><br>

        <label>Número de Legajo:</label>
        <input type="text" id="numeroLegajo" value="${escapeHtml(data.numeroLegajo || "")}" required>

        <label>Apellido y Nombre:</label>
        <input type="text" id="apellidoNombre" value="${escapeHtml(data.apellidoNombre || "")}" required>

        <label>Jerarquía:</label>
        <input type="text" id="jerarquia" value="${escapeHtml(data.jerarquia || "")}" required>

        <label>Domicilio:</label>
        <input type="text" id="domicilio" value="${escapeHtml(data.domicilio || "")}" required>

        <button id="guardarBtn">Guardar Cambios</button>
        <button id="volverCVBtn">Volver al CV</button>
      `;
      break;


    case "ultimoDestino":
      legajoContainer.innerHTML = `
        <h3>Último Destino</h3>
        <label>Último Destino:</label><input type="text" id="ultimoDestino" value="${escapeHtml(data.ultimoDestino || "")}" required>
        <button id="guardarBtn">Guardar Cambios</button>
        <button id="volverCVBtn">Volver al CV</button>
      `;
      break;

    case "situacionRevista":
      legajoContainer.innerHTML = `
        <h3>Situación de Revista</h3>
        <label>Situación de Revista:</label><input type="text" id="situacionRevista" value="${escapeHtml(data.situacionRevista || "")}" required>
        <button id="guardarBtn">Guardar Cambios</button>
        <button id="volverCVBtn">Volver al CV</button>
      `;
      break;

    case "concepto":
      legajoContainer.innerHTML = `
        <h3>Concepto (Solo Admin)</h3>
        <label>Concepto:</label><input type="text" id="concepto" value="${escapeHtml(data.concepto || "")}" readonly>
        <button id="volverCVBtn">Volver al CV</button>
      `;
      break;

    case "observacionesAdmin":
      legajoContainer.innerHTML = `
        <h3>Observaciones Admin (Solo Admin)</h3>
        <label>Observaciones:</label><textarea id="observacionesAdmin" readonly>${escapeHtml(data.observacionesAdmin || "")}</textarea>
        <button id="volverCVBtn">Volver al CV</button>
      `;
      break;

    // Futuras secciones: armamento, ascensos, licencias, etc.
    default:
      legajoContainer.innerHTML = `<p>Sección en construcción...</p><button id="volverCVBtn">Volver al CV</button>`;
  }

  // 📷 Subida de foto a Cloudinary PRO
  const fotoInput = document.getElementById("fotoInput");

  if (fotoInput) {
    fotoInput.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // 🔒 Validar tamaño máximo (2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert("La imagen no debe superar los 2MB");
        return;
      }

      // 📦 Loader + barra de progreso
      legajoContainer.insertAdjacentHTML("beforeend", `
        <div id="uploadStatus" style="margin-top:10px;">
          <p>Subiendo imagen...</p>
          <progress id="progressBar" value="0" max="100" style="width:200px;"></progress>
        </div>
      `);

      const progressBar = document.getElementById("progressBar");
      const uploadStatus = document.getElementById("uploadStatus");

      try {
        // 📉 Comprimir imagen antes de subir (resize a 400px ancho)
        const compressedFile = await compressImage(file, 0.7);

        const formData = new FormData();
        formData.append("file", compressedFile);
        formData.append("upload_preset", "legajos_public");

        // 📁 Organizar por UID en Cloudinary
        formData.append("folder", `legajos/${uid}`);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", "https://api.cloudinary.com/v1_1/doa7l0ksd/image/upload");

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            progressBar.value = percent;
          }
        });

        xhr.onload = async () => {
          // 🔒 Validar respuesta de Cloudinary
          if (xhr.status !== 200) {
            alert("Error al subir la imagen. Código: " + xhr.status);
            if (uploadStatus) uploadStatus.remove();
            return;
          }

          let response;
          try {
            response = JSON.parse(xhr.responseText);
          } catch (parseError) {
            alert("Error al procesar la respuesta del servidor");
            if (uploadStatus) uploadStatus.remove();
            return;
          }

          // Validar que la respuesta tenga secure_url
          if (!response || !response.secure_url) {
            alert("Error: La respuesta del servidor no contiene la URL de la imagen");
            if (uploadStatus) uploadStatus.remove();
            return;
          }

          // Obtener valor anterior antes de actualizar
          const legajoRefFoto = doc(db, "legajos", uid);
          const legajoActualFoto = (await getDoc(legajoRefFoto)).data();
          const valorAnteriorFoto = legajoActualFoto.fotoPerfilURL || "";

          // Registrar cambio en historial si es diferente
          if (valorAnteriorFoto !== response.secure_url) {
            await addDoc(collection(db, "legajos", uid, "historial"), {
              tipo: "modificacion",
              campo: "fotoPerfilURL",
              valorAnterior: valorAnteriorFoto,
              valorNuevo: response.secure_url,
              modificadoPorUID: auth.currentUser.uid,
              rol: rolUsuario,
              fecha: serverTimestamp()
            });
          }

          await updateDoc(legajoRefFoto, {
            fotoPerfilURL: response.secure_url
          });

          if (uploadStatus) uploadStatus.remove();

          alert("Foto subida correctamente");
          mostrarSeccion(uid, "datosPersonales", rolUsuario);
        };

        xhr.onerror = () => {
          alert("Error de red al subir la imagen");
          if (uploadStatus) uploadStatus.remove();
        };

        xhr.send(formData);
      } catch (error) {
        alert("Error al procesar la imagen: " + error.message);
        if (uploadStatus) uploadStatus.remove();
      }
    });
  }



  // Botón volver al CV
  const volverCVBtn = document.getElementById("volverCVBtn");
  if (volverCVBtn) {
    volverCVBtn.addEventListener("click", () => mostrarVistaCV(uid, rolUsuario));
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

      const legajoRefFinal = doc(db, "legajos", uid);
      const legajoActual = (await getDoc(legajoRefFinal)).data();

      for (const campo in actualizaciones) {
        if (legajoActual[campo] !== actualizaciones[campo]) {

          await addDoc(collection(db, "legajos", uid, "historial"), {
            tipo: "modificacion",
            campo: campo,
            valorAnterior: legajoActual[campo] || "",
            valorNuevo: actualizaciones[campo] || "",
            modificadoPorUID: auth.currentUser.uid,
            rol: rolUsuario,
            fecha: serverTimestamp()
          });

        }
      }

      await updateDoc(legajoRefFinal, actualizaciones);
      alert("Sección actualizada correctamente");
      mostrarVistaCV(uid, rolUsuario); // Regresar al CV después de guardar
    });
  }
}

// 📉 Función para comprimir imagen
function compressImage(file, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onerror = () => {
      reject(new Error("Error al leer el archivo"));
    };

    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      
      img.onerror = () => {
        reject(new Error("Error al cargar la imagen"));
      };

      img.src = event.target.result;
      
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 400;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Error al comprimir la imagen"));
                return;
              }
              resolve(new File([blob], file.name, { type: "image/jpeg" }));
            },
            "image/jpeg",
            quality
          );
        } catch (error) {
          reject(new Error("Error al procesar la imagen: " + error.message));
        }
      };
    };
  });
}

// 📜 Función para mostrar historial completo del legajo
async function mostrarHistorial(uid, rolUsuario) {
  if (!legajoContainer) {
    console.error("Error: legajoContainer no está disponible");
    return;
  }

  try {
    const historialRef = collection(db, "legajos", uid, "historial");
    const q = query(historialRef, orderBy("fecha", "desc"));
    const snapshot = await getDocs(q);

    let historialHTML = `<h3>Historial Completo del Legajo</h3>`;

    if (snapshot.empty) {
      historialHTML += `<p>No hay registros aún.</p>`;
    } else {
      snapshot.forEach(docSnap => {
        const h = docSnap.data();
        const fecha = h.fecha?.toDate().toLocaleString() || "Sin fecha";

        historialHTML += `
          <div style="border:1px solid #ccc; padding:10px; margin-bottom:10px;">
            <strong>Tipo:</strong> ${escapeHtml(h.tipo)}<br>
            <strong>Campo:</strong> ${escapeHtml(h.campo)}<br>
            <strong>Antes:</strong> ${escapeHtml(h.valorAnterior || "—")}<br>
            <strong>Ahora:</strong> ${escapeHtml(h.valorNuevo || "—")}<br>
            <strong>Rol:</strong> ${escapeHtml(h.rol)}<br>
            <strong>UID:</strong> ${escapeHtml(h.modificadoPorUID)}<br>
            <strong>Fecha:</strong> ${escapeHtml(fecha)}
          </div>
        `;
      });
    }

    historialHTML += `<button id="volverCVBtn">Volver al CV</button>`;

    legajoContainer.innerHTML = historialHTML;

    const volverCVBtn = document.getElementById("volverCVBtn");
    if (volverCVBtn) {
      volverCVBtn.addEventListener("click", () => mostrarVistaCV(uid, rolUsuario));
    }
  } catch (error) {
    console.error("Error al cargar historial:", error);
    legajoContainer.innerHTML = `
      <h3>Error al cargar el historial</h3>
      <p style="color:red;">No tienes permisos para ver el historial o hay un error de configuración.</p>
      <p><strong>Error:</strong> ${escapeHtml(error.message)}</p>
      <button id="volverCVBtn">Volver al CV</button>
    `;
    
    const volverCVBtn = document.getElementById("volverCVBtn");
    if (volverCVBtn) {
      volverCVBtn.addEventListener("click", () => mostrarVistaCV(uid, rolUsuario));
    }
  }
}

// 🔔 Verificar notificaciones no leídas
async function verificarNotificaciones(uid) {
  try {
    const notiRef = collection(db, "legajos", uid, "notificaciones");
    const q = query(notiRef, where("leida", "==", false));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return;

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      mostrarModalNotificacion(uid, docSnap.id, data.mensaje);
    });
  } catch (error) {
    console.error("Error al verificar notificaciones:", error);
  }
}

// 🔔 Mostrar modal de notificación
function mostrarModalNotificacion(uid, notiId, mensaje) {
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

  modal.innerHTML = `
    <div style="background:white; padding:30px; width:400px; border-radius:8px; text-align:center;">
      <h3>Sugerencia del Administrador</h3>
      <p style="margin:20px 0;">${escapeHtml(mensaje)}</p>
      <button id="marcarLeidoBtn">Marcar como leído</button>
    </div>
  `;

  document.body.appendChild(modal);

  const marcarLeidoBtn = document.getElementById("marcarLeidoBtn");
  if (marcarLeidoBtn) {
    marcarLeidoBtn.addEventListener("click", async () => {
      try {
        await updateDoc(
          doc(db, "legajos", uid, "notificaciones", notiId),
          { leida: true }
        );

        modal.remove();
      } catch (error) {
        console.error("Error al marcar notificación como leída:", error);
        alert("Error al marcar la notificación como leída");
      }
    });
  }
}
