import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import app from "../FirebaseConfiguration";
import { getDatabase, ref, set, push } from "firebase/database"; // Cambiamos get por set y push

function Registro() {
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [tipoUsuario, setTipoUsuario] = useState("OperarioPlanta"); // Valor por defecto
  const [mensaje, setMensaje] = useState("");
  const navigate = useNavigate();

  const registrarUsuario = async () => {
    if (!nombreUsuario.trim()) {
      setMensaje("El nombre de usuario es requerido");
      return;
    }

    const db = getDatabase(app);
    const usuariosRef = ref(db, "usuarios/usuarios");
    const nuevoUsuario = {
      nombreUsuario,
      tipoUsuario
    };

    try {
      // Guardar el nuevo usuario en Firebase
      const nuevoRegistroRef = push(usuariosRef);
      await set(nuevoRegistroRef, nuevoUsuario);
      
      setMensaje("Usuario registrado exitosamente ✅");
      setTimeout(() => navigate("/Muestras"), 1500); // Redirigir después de 1.5 segundos
    } catch (error) {
      setMensaje("Error al registrar: " + error.message);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <h2>Registro de Usuario</h2>
      <div style={{ marginBottom: '15px' }}>
        <input
          type="text"
          placeholder="Nombre de usuario"
          value={nombreUsuario}
          onChange={(e) => setNombreUsuario(e.target.value)}
          style={{ width: '100%', padding: '8px' }}
        />
      </div>
      
      <div style={{ marginBottom: '15px' }}>
        <select 
          value={tipoUsuario}
          onChange={(e) => setTipoUsuario(e.target.value)}
          style={{ width: '100%', padding: '8px' }}
        >
          <option value="Administrativo">Administrativo</option>
          <option value="OperarioPlanta">Operario de Planta</option>
          <option value="OperarioBocatoma">Operario de Bocatoma</option>
        </select>
      </div>

      <button 
        onClick={registrarUsuario}
        style={{ 
          width: '100%', 
          padding: '10px', 
          backgroundColor: '#4CAF50', 
          color: 'white', 
          border: 'none', 
          cursor: 'pointer' 
        }}
      >
        Registrar Usuario
      </button>
      
      {mensaje && <p style={{ marginTop: '15px', color: mensaje.includes('✅') ? 'green' : 'red' }}>{mensaje}</p>}
    </div>
  );
}

export default Registro;