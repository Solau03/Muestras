import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // 1. Importar useNavigate
import app from "../FirebaseConfiguration";
import { getDatabase, ref, get, child } from "firebase/database";

function Login({ onLoginSuccess }) {
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [mensaje, setMensaje] = useState("");
  const navigate = useNavigate(); // 2. Inicializar navigate

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
          localStorage.setItem("nombreUsuario", usuarioEncontrado.nombreUsuario);
          localStorage.setItem("tipoUsuario", usuarioEncontrado.tipoUsuario); // 3. Guardar tipo en localStorage
          
          setMensaje("Inicio de sesión exitoso ✅");
          
          // 4. Redirigir según el tipo de usuario
          switch(usuarioEncontrado.tipoUsuario) {
            case "Administrativo":
              navigate("/Muestras");
              break;
            case "OperarioPlanta":
              navigate("/OperarioMuestras");
              break;
            case "OperarioBocatoma":
              navigate("/Operario Muestras");
              break;
            default:
              navigate("/Muestras"); // Ruta por defecto
          }

          if (onLoginSuccess) onLoginSuccess(usuarioEncontrado);
        } else {
          setMensaje("❌ Usuario no encontrado");
        }
      } else {
        setMensaje("⚠️ No hay usuarios registrados");
      }
    } catch (error) {
      setMensaje("Error: " + error.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-sm">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Iniciar Sesión</h2>
        <input
          type="text"
          placeholder="Nombre de usuario"
          value={nombreUsuario}
          onChange={(e) => setNombreUsuario(e.target.value)}
          className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={iniciarSesion}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
        >
          Iniciar Sesión
        </button>
        {mensaje && (
          <p className="mt-4 text-center text-sm text-gray-700">{mensaje}</p>
        )}
      </div>
    </div>
  );
}

export default Login;