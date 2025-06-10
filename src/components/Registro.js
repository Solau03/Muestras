// components/FormularioRegistroUsuario.js
import { useState } from "react";
import { getDatabase, ref, set, push } from "firebase/database";
import app from "../FirebaseConfiguration";

export default function FormularioRegistroUsuario({ onClose, onUsuarioCreado }) {
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [tipoUsuario, setTipoUsuario] = useState("OperarioPlanta");
  const [mensaje, setMensaje] = useState("");

  const registrarUsuario = async () => {
    if (!nombreUsuario.trim()) {
      setMensaje("El nombre de usuario es requerido");
      return;
    }

    const db = getDatabase(app);
    const usuariosRef = ref(db, "usuarios/usuarios");
    const nuevoUsuario = { nombreUsuario, tipoUsuario };

    try {
      const nuevoRegistroRef = push(usuariosRef);
      await set(nuevoRegistroRef, nuevoUsuario);
      setMensaje("Usuario registrado exitosamente ✅");

      if (onUsuarioCreado) onUsuarioCreado(); // Refrescar lista
      setTimeout(() => onClose(), 1000); // Cierra el modal después de 1s
    } catch (error) {
      setMensaje("Error al registrar: " + error.message);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg w-96">
      <h2 className="text-xl font-semibold mb-4">Registrar Usuario</h2>
      <input
        type="text"
        placeholder="Nombre de usuario"
        value={nombreUsuario}
        onChange={(e) => setNombreUsuario(e.target.value)}
        className="w-full mb-4 p-2 border rounded"
      />
      <select
        value={tipoUsuario}
        onChange={(e) => setTipoUsuario(e.target.value)}
        className="w-full mb-4 p-2 border rounded"
      >
        <option value="Administrativo">Administrativo</option>
        <option value="OperarioPlanta">Operario de Planta</option>
        <option value="OperarioBocatoma">Operario de Bocatoma</option>
      </select>
      <button
        onClick={registrarUsuario}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded"
      >
        Registrar
      </button>
      {mensaje && (
        <p className="mt-3 text-sm text-center text-green-600">{mensaje}</p>
      )}
    </div>
  );
}
