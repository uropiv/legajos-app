import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// REGISTRO
export async function registrar(email, password) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    await setDoc(doc(db, "usuarios", cred.user.uid), {
      email: email,
      estado: "pendiente",
      rol: "usuario",
      creado: new Date()
    });

    alert("Registro exitoso. Esperando aprobación del administrador.");
  } catch (error) {
    alert(error.message);
  }
}

// LOGIN
export async function login(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);

    const userDoc = await getDoc(doc(db, "usuarios", cred.user.uid));
    const data = userDoc.data();

    if (data.estado !== "activo") {
      alert("Tu cuenta aún no fue activada.");
      await signOut(auth);
      return;
    }

    if (data.rol === "admin") {
      window.location.href = "admin.html";
    } else {
      window.location.href = "dashboard.html";
    }

  } catch (error) {
    alert(error.message);
  }
}
