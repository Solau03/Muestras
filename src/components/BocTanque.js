import React, { useState, useEffect } from "react";
import app from "../FirebaseConfiguration";
import { useNavigate } from "react-router-dom";
import { getDatabase, ref, push, set, onValue } from "firebase/database";

function BocNivelTanque() {
  const [nivel, setNivel] = useState("");
  const [registros, setRegistros] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 10;
  const usuario = localStorage.getItem("nombreUsuario") || "Desconocido";
  const navigate = useNavigate();
  

  const db = getDatabase(app);

  // Cargar registros iniciales
  useEffect(() => {
    const registrosRef = ref(db, "nivelTanque/registros");
    const unsubscribe = onValue(registrosRef, (snapshot) => {
      const data = snapshot.val();
      const lista = data ? Object.values(data) : [];
      // Ordenar por timestamp descendente (más reciente primero)
      setRegistros(lista.sort((a, b) => b.timestamp - a.timestamp));
    });
    return () => unsubscribe();
  }, [db]);

  // Guardar nuevo registro
  const guardarRegistro = async () => {
    const valor = parseFloat(nivel);
    if (isNaN(valor) || valor < 0) {
      setMensaje("⚠️ Ingrese un valor válido en metros");
      return;
    }

    const fecha = new Date().toLocaleDateString("es-CO");
    const hora = new Date().toLocaleTimeString("es-CO", { hour: '2-digit', minute: '2-digit' });

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

  // Paginación
  const indiceUltimoRegistro = paginaActual * registrosPorPagina;
  const indicePrimerRegistro = indiceUltimoRegistro - registrosPorPagina;
  const registrosActuales = registros.slice(indicePrimerRegistro, indiceUltimoRegistro);
  const totalPaginas = Math.ceil(registros.length / registrosPorPagina);

  const cambiarPagina = (numeroPagina) => setPaginaActual(numeroPagina);
   const cerrarSesion = () => {
    // Limpiar localStorage y redirigir al login
    localStorage.removeItem("nombreUsuario");
    localStorage.removeItem("tipoUsuario");
    navigate("/log");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
       {/* Responsive Header */}
      <header className="bg-blue-400 text-white p-3 sm:p-4 shadow-md flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
        <div className="text-center sm:text-left">
          <h1 className="text-xl sm:text-2xl font-bold">Bienvenido</h1>
          <p className="text-xs sm:text-sm">👤 {usuario}</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => navigate("/BocatomaDashboard")}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 sm:px-4 sm:py-2 rounded text-sm sm:text-base transition-colors"
          >
            Inicio
          </button>
          <button 
            onClick={cerrarSesion}
            className="bg-red-500 hover:bg-red-600 px-3 py-1 sm:px-4 sm:py-2 rounded text-sm sm:text-base transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </header>
      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Registro de Nivel de Tanque</h1>
          
          {/* Formulario de registro */}
          <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nivel del Tanque (metros)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={nivel}
                  onChange={(e) => setNivel(e.target.value)}
                  className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: 1.50"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={guardarRegistro}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors w-full md:w-auto"
                >
                  Registrar Nivel
                </button>
              </div>
            </div>
            {mensaje && (
              <p className={`mt-2 text-sm ${
                mensaje.includes("✅") ? "text-green-600" : "text-red-600"
              }`}>
                {mensaje}
              </p>
            )}
          </div>

          {/* Tabla de registros */}
          <div className="overflow-x-auto">
            <h2 className="text-xl font-semibold mb-4">Historial de Lecturas</h2>
            <div className="bg-white rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nivel (m)</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {registrosActuales.length > 0 ? (
                    registrosActuales.map((registro, index) => (
                      <tr key={index} className="hover:bg-indigo-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{registro.fecha}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{registro.hora}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                            {registro.nivel.toFixed(2)} m
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="px-4 py-4 text-center text-sm text-gray-500">
                        No hay registros disponibles
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {registros.length > registrosPorPagina && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-700">
                  Mostrando {indicePrimerRegistro + 1} a {Math.min(indiceUltimoRegistro, registros.length)} de {registros.length} registros
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => cambiarPagina(paginaActual - 1)}
                    disabled={paginaActual === 1}
                    className="px-3 py-1 border rounded-md text-sm font-medium disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  {[...Array(totalPaginas)].map((_, index) => (
                    <button
                      key={index}
                      onClick={() => cambiarPagina(index + 1)}
                      className={`px-3 py-1 border rounded-md text-sm font-medium ${paginaActual === index + 1 ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
                    >
                      {index + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => cambiarPagina(paginaActual + 1)}
                    disabled={paginaActual === totalPaginas}
                    className="px-3 py-1 border rounded-md text-sm font-medium disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BocNivelTanque;