import React, { useState } from "react";
import app from "../FirebaseConfiguration";
import { getDatabase, ref, get, child } from "firebase/database";

function Login({ onLoginSuccess }) {
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [mensaje, setMensaje] = useState("");

  const iniciarSesion = async () => {
    const dbRef = ref(getDatabase(app));

    try {
      const snapshot = await get(child(dbRef, "usuarios/usuarios"));
      if (snapshot.exists()) {
        const usuarios = snapshot.val();
        const usuarioEncontrado = Object.values(usuarios).find(
          (user) => user.nombreUsuario === nombreUsuario
        );

        if (usuarioEncontrado) {
          // ✅ Guardamos el nombre en localStorage
          localStorage.setItem("nombreUsuario", usuarioEncontrado.nombreUsuario);

          setMensaje("Inicio de sesión exitoso");
          if (onLoginSuccess) onLoginSuccess(usuarioEncontrado);
        } else {
          setMensaje("Usuario no encontrado");
        }
      } else {
        setMensaje("No hay usuarios registrados");
      }
    } catch (error) {
      setMensaje("Error: " + error.message);
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Nombre de usuario"
        value={nombreUsuario}
        onChange={(e) => setNombreUsuario(e.target.value)}
      />
      <br />
      <button onClick={iniciarSesion}>Iniciar Sesión</button>
      <p>{mensaje}</p>
    </div>
  );
}

export default Login;
