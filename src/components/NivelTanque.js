import React, { useState, useEffect } from "react";
import app from "../FirebaseConfiguration";
import { getDatabase, ref, push, set, onValue } from "firebase/database";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

function NivelTanque() {
  const [nivel, setNivel] = useState("");
  const [registros, setRegistros] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [filtroUsuario, setFiltroUsuario] = useState("Todos");

  const db = getDatabase(app);

  // Cargar registros iniciales
  useEffect(() => {
    const registrosRef = ref(db, "nivelTanque/registros");
    const unsubscribe = onValue(registrosRef, (snapshot) => {
      const data = snapshot.val();
      const lista = data ? Object.values(data) : [];
      setRegistros(lista.reverse());
    });
    return () => unsubscribe();
  }, [db]);

  // Guardar nuevo registro
  const guardarRegistro = async () => {
    const valor = parseFloat(nivel);
    if (isNaN(valor) || valor < 0) {
      setMensaje("⚠️ Ingrese un valor válido en centímetros");
      return;
    }

    const usuario = localStorage.getItem("nombreUsuario") || "Desconocido";
    const fecha = new Date().toLocaleDateString("es-CO");
    const hora = new Date().toLocaleTimeString("es-CO");

    try {
      const nuevoRegistro = {
        usuario,
        nivel: valor,
        fecha,
        hora,
        timestamp: Date.now()
      };

      await set(push(ref(db, "nivelTanque/registros")), nuevoRegistro);
      setNivel("");
      setMensaje("✅ Registro guardado exitosamente");
      setTimeout(() => setMensaje(""), 3000);
    } catch (error) {
      setMensaje("❌ Error al guardar: " + error.message);
    }
  };

  // Filtrar registros por usuario
  const registrosFiltrados = filtroUsuario === "Todos" 
    ? registros 
    : registros.filter(r => r.usuario === filtroUsuario);

  // Obtener lista de usuarios únicos
  const usuarios = [...new Set(registros.map(r => r.usuario))];

  // Exportar a Excel
  const exportarExcel = () => {
    const data = registrosFiltrados.map(registro => ({
      "Usuario": registro.usuario,
      "Fecha": registro.fecha,
      "Hora": registro.hora,
      "Nivel (cm)": registro.nivel
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "NivelTanque");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `NivelTanque_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg p-6 flex-shrink-0">
        <h2 className="text-2xl font-bold text-blue-700 mb-8">Admin</h2>
        <nav className="space-y-4">
          <a href="/Muestras" className="block text-gray-700 hover:text-blue-600">Muestras Calidad</a>
          <a href="/NivelTanque" className="block text-gray-700 hover:text-blue-600">Nivel de Tanque</a>
          <a href="/AdmiOrden" className="block text-gray-700 hover:text-blue-600">Órdenes Reparación</a>
          <a href="/Macros" className="block text-gray-700 hover:text-blue-600">Lecturas Macro</a>
        </nav>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-4xl mx-auto bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Registro de Nivel de Tanque</h2>
          
          {/* Formulario de registro */}
          <div className="mb-8 p-4 border rounded-lg bg-blue-50">
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nivel del Tanque (cm)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={nivel}
                  onChange={(e) => setNivel(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: 150"
                />
              </div>
              <button
                onClick={guardarRegistro}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Registrar
              </button>
            </div>
            {mensaje && (
              <p className={`mt-2 text-sm ${
                mensaje.includes("✅") ? "text-green-600" : "text-red-600"
              }`}>
                {mensaje}
              </p>
            )}
          </div>

          {/* Filtros y exportación */}
          <div className="flex justify-between items-center mb-4">
            <div className="w-64">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filtrar por usuario:
              </label>
              <select
                value={filtroUsuario}
                onChange={(e) => setFiltroUsuario(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="Todos">Todos los usuarios</option>
                {usuarios.map((user) => (
                  <option key={user} value={user}>
                    {user}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={exportarExcel}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Exportar a Excel
            </button>
          </div>

          {/* Tabla de registros */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nivel (cm)</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {registrosFiltrados.length > 0 ? (
                  registrosFiltrados.map((registro, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{registro.usuario}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{registro.fecha}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{registro.hora}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {registro.nivel} cm
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                      No hay registros disponibles
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

export default NivelTanque;