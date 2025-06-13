import { useEffect, useState } from "react";
import { getDatabase, ref, get, child } from "firebase/database";
import app from "../FirebaseConfiguration";

export default function OperarioDashboard({ usuario }) {
  const [nombre, setNombre] = useState("");

  useEffect(() => {
    if (usuario) {
      const db = getDatabase(app);
      const dbRef = ref(db);
      get(child(dbRef, `usuarios/usuarios/${usuario.uid}`)).then(snapshot => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setNombre(data.nombreUsuario || "");
        }
      });
    }
  }, [usuario]);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-blue-700 text-white p-4 shadow-md flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Panel del Operario</h1>
          <p className="text-sm">👤 {nombre} | {usuario?.tipoUsuario}</p>
        </div>
        <button className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded">
          Cerrar sesión
        </button>
      </header>

      {/* Contenido */}
      <main className="p-6">
        <h2 className="text-xl font-semibold mb-4">Acciones disponibles:</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <button className="bg-green-600 hover:bg-green-700 text-white py-3 px-5 rounded-xl shadow">
            Registrar muestra
          </button>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-5 rounded-xl shadow">
            Ver historial de muestras
          </button>
        </div>
      </main>
    </div>
  );
}
