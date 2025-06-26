import React, { useState, useEffect, useMemo } from "react";
import app from "../FirebaseConfiguration";
import { getDatabase, ref, push, set, onValue } from "firebase/database";
import { useNavigate } from "react-router-dom";

function BocMacroLecturas() {
  // Estado para inputs independientes por tipo de macro
  const [lecturasInput, setLecturasInput] = useState({});
  const [mensaje, setMensaje] = useState("");
  const [lecturas, setLecturas] = useState([]);
  const [filtroMacro, setFiltroMacro] = useState("Todos");
  const [paginaActual, setPaginaActual] = useState(1);
  const registrosPorPagina = 10;
  const usuario = localStorage.getItem("nombreUsuario") || "Desconocido";
   const navigate = useNavigate();

  const db = getDatabase(app);

  // Carga inicial del historial desde Firebase
  useEffect(() => {
    const refLecturas = ref(db, "Macros/Macros");
    const unsubscribe = onValue(refLecturas, (snapshot) => {
      const data = snapshot.val();
      const lista = data ? Object.values(data) : [];
      setLecturas(lista.reverse()); // Más recientes primero
    });
    return () => unsubscribe();
  }, [db]);

  // Guarda una lectura para el tipo de macro seleccionado
  const guardarLectura = async (tipoMacro) => {
    const valor = parseFloat(lecturasInput[tipoMacro]);
    if (isNaN(valor)) {
      setMensaje("⚠️ Ingrese un número válido");
      return;
    }

    const usuario = localStorage.getItem("nombreUsuario") || "Desconocido";
    const fecha = new Date().toLocaleDateString("es-CO");
    const hora = new Date().toLocaleTimeString("es-CO");

    const nuevaLectura = { tipoMacro, lectura: valor, usuario, fecha, hora };

    try {
      const macrosRef = ref(db, "Macros/Macros");
      await set(push(macrosRef), nuevaLectura);
      setLecturasInput(prev => ({ ...prev, [tipoMacro]: "" }));
      setMensaje(`✅ Lectura guardada para ${tipoMacro}`);
      setTimeout(() => setMensaje(""), 3000);
    } catch (error) {
      setMensaje("❌ Error al guardar: " + error.message);
      setTimeout(() => setMensaje(""), 3000);
    }
  };

  // Tipos de macro disponibles
  const macros = [
    'Macro 8" - Entrada Planta',
    'Macro 6" - Salida Planta',
    'Macro 4" - Laguneta',
    'Macro 4" - General',
  ];

  // Filtrado memoizado
  const lecturasFiltradas = useMemo(() => {
    if (filtroMacro === "Todos") return lecturas;
    return lecturas.filter(l => l.tipoMacro === filtroMacro);
  }, [lecturas, filtroMacro]);

  // Paginación
  const indiceUltimoRegistro = paginaActual * registrosPorPagina;
  const indicePrimerRegistro = indiceUltimoRegistro - registrosPorPagina;
  const registrosActuales = lecturasFiltradas.slice(indicePrimerRegistro, indiceUltimoRegistro);
  const totalPaginas = Math.ceil(lecturasFiltradas.length / registrosPorPagina);

  const cambiarPagina = (numeroPagina) => setPaginaActual(numeroPagina);
  const cerrarSesion = () => {
    // Limpiar localStorage y redirigir al login
    localStorage.removeItem("nombreUsuario");
    localStorage.removeItem("tipoUsuario");
    navigate("/log");
  };

  return (
   <div className="min-h-screen flex flex-col bg-gradient-to-br from-white-100 to-white-100">
  {/* Header Responsive */}
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

  {/* Contenido Principal Responsive */}
  <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
    <div className="max-w-3xl mx-auto bg-white shadow rounded-lg p-4 sm:p-6">
      {/* Título Responsive */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-0">Registro de Lecturas por Macromedidor</h2>
      </div>

      {/* Formularios Responsive */}
      {macros.map((tipoMacro, index) => (
        <div key={index} className="mb-4 sm:mb-6 border-t pt-3 sm:pt-4">
          <h3 className="text-base sm:text-lg font-semibold">{tipoMacro}</h3>
          <div className="flex flex-col sm:flex-row gap-2 mt-2">
            <input
              type="number"
              placeholder="Lectura m³/día"
              value={lecturasInput[tipoMacro] || ""}
              onChange={(e) => setLecturasInput(prev => ({ ...prev, [tipoMacro]: e.target.value }))}
              className="flex-1 p-2 border rounded text-sm sm:text-base"
            />
            <button
              onClick={() => guardarLectura(tipoMacro)}
              className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded hover:bg-blue-700 text-sm sm:text-base transition-colors"
            >
              Guardar
            </button>
          </div>
        </div>
      ))}

      {/* Mensaje Responsive */}
      {mensaje && (
        <p className={`text-center text-xs sm:text-sm mt-2 ${
          mensaje.includes("✅") ? "text-green-600" : "text-red-600"
        }`}>
          {mensaje}
        </p>
      )}

      {/* Filtro Responsive */}
      <div className="mt-6 sm:mt-8 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="w-full sm:w-1/2">
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Filtrar por Tipo de Macro:
          </label>
          <select
            value={filtroMacro}
            onChange={e => {
              setFiltroMacro(e.target.value);
              setPaginaActual(1);
            }}
            className="w-full p-2 border rounded text-sm sm:text-base"
          >
            <option>Todos</option>
            {macros.map(m => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla Responsive */}
      <div className="mt-4 sm:mt-6">
        <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Historial de Lecturas</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 sm:px-4 sm:py-2 text-left text-xs sm:text-sm font-medium text-gray-700">Fecha</th>
                <th className="px-3 py-2 sm:px-4 sm:py-2 text-left text-xs sm:text-sm font-medium text-gray-700">Hora</th>
                <th className="px-3 py-2 sm:px-4 sm:py-2 text-left text-xs sm:text-sm font-medium text-gray-700">Tipo</th>
                <th className="px-3 py-2 sm:px-4 sm:py-2 text-left text-xs sm:text-sm font-medium text-gray-700">Lectura (m³/día)</th>
              </tr>
            </thead>
            <tbody>
              {registrosActuales.length > 0 ? (
                registrosActuales.map((l, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm text-gray-800">{l.fecha}</td>
                    <td className="px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm text-gray-800">{l.hora}</td>
                    <td className="px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm text-gray-800">{l.tipoMacro}</td>
                    <td className="px-3 py-2 sm:px-4 sm:py-2 text-xs sm:text-sm text-gray-800">{l.lectura}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-4 py-3 text-center text-xs sm:text-sm text-gray-500">
                    No hay registros disponibles
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación Responsive */}
      {lecturasFiltradas.length > registrosPorPagina && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-3">
          <div className="text-xs sm:text-sm text-gray-700">
            Mostrando {indicePrimerRegistro + 1} a {Math.min(indiceUltimoRegistro, lecturasFiltradas.length)} de {lecturasFiltradas.length} registros
          </div>
          <div className="flex flex-wrap justify-center gap-1">
            <button
              onClick={() => cambiarPagina(paginaActual - 1)}
              disabled={paginaActual === 1}
              className="px-2 sm:px-3 py-1 border rounded-md text-xs sm:text-sm font-medium disabled:opacity-50"
            >
              Anterior
            </button>
            {[...Array(totalPaginas)].map((_, index) => (
              <button
                key={index}
                onClick={() => cambiarPagina(index + 1)}
                className={`px-2 sm:px-3 py-1 border rounded-md text-xs sm:text-sm font-medium ${
                  paginaActual === index + 1 ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'
                }`}
              >
                {index + 1}
              </button>
            ))}
            <button
              onClick={() => cambiarPagina(paginaActual + 1)}
              disabled={paginaActual === totalPaginas}
              className="px-2 sm:px-3 py-1 border rounded-md text-xs sm:text-sm font-medium disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  </main>
</div>
  );
}

export default BocMacroLecturas;