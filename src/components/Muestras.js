import React, { useState } from "react";
import app from "../FirebaseConfiguration";
import { getDatabase, ref, set, push } from "firebase/database";

function Muestras() {
  const [turbiedad, setTurbiedad] = useState("");
  const [ph, setPh] = useState("");
  const [color, setColor] = useState("");

  const guardarDatos = async () => {
    const db = getDatabase(app);

    const nombreUsuario = localStorage.getItem("nombreUsuario") || "Desconocido";
    const fecha = new Date().toLocaleDateString(); // formato: dd/mm/yyyy
    const hora = new Date().toLocaleTimeString(); // formato: hh:mm:ss

    const newDocRef = push(ref(db, "muestras/muestras"));

    set(newDocRef, {
      nombreUsuario: nombreUsuario,
      Turbiedad: turbiedad,
      Ph: ph,
      Color: color,
      Fecha: fecha,
      Hora: hora
    })
      .then(() => {
        alert("Se registró la muestra exitosamente");
        setTurbiedad("");
        setPh("");
        setColor("");
      })
      .catch((error) => {
        alert("Error: " + error.message);
      });
  };

  return (
    <div>
      <h2>Registro de Muestras</h2>
      <input
        type="text"
        placeholder="Turbiedad"
        value={turbiedad}
        onChange={(e) => setTurbiedad(e.target.value)}
      />
      <br />
      <input
        type="text"
        placeholder="Ph"
        value={ph}
        onChange={(e) => setPh(e.target.value)}
      />
      <br />
      <input
        type="text"
        placeholder="Color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
      />
      <br />
      <button onClick={guardarDatos}>Guardar Datos</button>
    </div>
  );
}

export default Muestras;
