import React, { useState, useEffect, useMemo } from "react";
import app from "../FirebaseConfiguration";
import { getDatabase, ref, push, set, onValue, remove } from "firebase/database";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

function MacroLecturas() {
  const [lecturasInput, setLecturasInput] = useState({});
  const [mensaje, setMensaje] = useState("");
  const [lecturas, setLecturas] = useState([]);
  const [filtroMacro, setFiltroMacro] = useState("Todos");
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Estados para la paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [registrosPorPagina] = useState(10);

  const db = getDatabase(app);

  // Carga inicial del historial desde Firebase
  useEffect(() => {
    const refLecturas = ref(db, "Macros/Macros");
    const unsubscribe = onValue(refLecturas, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const lista = Object.entries(data).map(([id, lectura]) => ({ id, ...lectura }));
        setLecturas(lista.reverse()); // Más recientes primero
        setPaginaActual(1); // Resetear a la primera página al cargar nuevos datos
      } else {
        setLecturas([]);
      }
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

    setLoading(true);
    const usuario = localStorage.getItem("nombreUsuario") || "Desconocido";
    const fecha = new Date().toLocaleDateString("es-CO");
    const hora = new Date().toLocaleTimeString("es-CO");

    const nuevaLectura = { tipoMacro, lectura: valor, usuario, fecha, hora };

    try {
      const macrosRef = ref(db, "Macros/Macros");
      await set(push(macrosRef), nuevaLectura);
      setLecturasInput(prev => ({ ...prev, [tipoMacro]: "" }));
      setMensaje(`✅ Lectura guardada para ${tipoMacro}`);
    } catch (error) {
      setMensaje("❌ Error al guardar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Eliminar una lectura
  const eliminarLectura = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar esta lectura?")) return;
    
    try {
      setLoading(true);
      const lecturaRef = ref(db, `Macros/Macros/${id}`);
      await remove(lecturaRef);
      setMensaje("✅ Lectura eliminada correctamente");
    } catch (error) {
      setMensaje("❌ Error al eliminar: " + error.message);
    } finally {
      setLoading(false);
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

  // Cálculos para paginación
  const totalPaginas = Math.ceil(lecturasFiltradas.length / registrosPorPagina);
  const registrosPaginaActual = useMemo(() => {
    const inicio = (paginaActual - 1) * registrosPorPagina;
    const fin = inicio + registrosPorPagina;
    return lecturasFiltradas.slice(inicio, fin);
  }, [lecturasFiltradas, paginaActual, registrosPorPagina]);

  // Cambiar de página
  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Función para exportar a Excel
  const exportToExcel = () => {
    const dataToExport = lecturasFiltradas.map(lectura => ({
      "Operario": lectura.usuario,
      "Fecha": lectura.fecha,
      "Hora": lectura.hora,
      "Tipo de Macro": lectura.tipoMacro,
      "Lectura (m³/día)": lectura.lectura
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "LecturasMacro");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, `LecturasMacro_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      {/* Overlay para móviles */}
      {menuAbierto && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setMenuAbierto(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed md:sticky top-0 z-30 md:z-0 w-64 bg-white shadow-md p-4 transform transition-transform duration-300 ease-in-out h-screen md:h-auto ${
        menuAbierto ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-blue-600">Admin</h2>
          <button 
            className="md:hidden text-gray-500 text-xl"
            onClick={() => setMenuAbierto(false)}
          >
            ×
          </button>
        </div>
        <nav className="space-y-2">
          <a href="/Admi" className="block py-2 px-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded transition">Usuarios</a>
          <a href="/Muestras" className="block py-2 px-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded transition">Muestras Calidad</a>
          <a href="/Muestrasreportes" className="block py-2 px-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded transition">Reportes calidad</a>
          <a href="/AdmiTanque" className="block py-2 px-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded transition">Lecturas Tanque</a>
          <a href="/ReporteTanque" className="block py-2 px-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded transition">Reportes Tanque</a>
          <a href="/AdmiOrden" className="block py-2 px-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded transition">Ordenes Reparación</a>
          <a href="/ReporteMacros" className="block py-2 px-3 text-gray-700 hover:bg-blue-50 hover:text-red-500 rounded transition">Reportes Macro</a>
          <a href="/AdmiBocatoma" className="block py-2 px-3 text-gray-700 hover:bg-blue-50 hover:text-red-500 rounded transition">Visita Bocatoma</a>
          <a href="/AdmiManzano" className="block py-2 px-3 text-gray-700 hover:bg-blue-50 hover:text-red-500 rounded transition">Muestras Manzano</a>
          <a href="/ReportesManzano" className="block py-2 px-3 text-gray-700 hover:bg-blue-50 hover:text-red-500 rounded transition">Reportes Manzano</a>
        </nav>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 p-4 md:p-6">
        {/* Mobile menu button */}
        <button 
          className="md:hidden fixed top-4 left-4 z-40 bg-blue-600 text-white p-2 rounded-full shadow-lg"
          onClick={() => setMenuAbierto(!menuAbierto)}
        >
          {menuAbierto ? '✕' : '☰'}
        </button>

        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mx-auto bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Registro de Lecturas por Macromedidor</h2>
            </div>

            {/* Formulario por cada tipo de macro */}
            {macros.map((tipoMacro, index) => (
              <div key={index} className="mb-6 border-t pt-4">
                <h3 className="text-lg font-semibold">{tipoMacro}</h3>
                <div className="flex gap-2 mt-2">
                  <input
                    type="number"
                    placeholder="Lectura m³/día"
                    value={lecturasInput[tipoMacro] || ""}
                    onChange={(e) =>
                      setLecturasInput(prev => ({ ...prev, [tipoMacro]: e.target.value }))
                    }
                    className="p-2 border rounded w-1/2"
                    step="0.01"
                  />
                  <button
                    onClick={() => guardarLectura(tipoMacro)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            ))}

            {mensaje && (
              <div className={`text-center text-sm mt-2 p-2 rounded ${
                mensaje.includes('✅') ? 'bg-green-100 text-green-700' : 
                mensaje.includes('⚠️') ? 'bg-yellow-100 text-yellow-700' : 
                'bg-red-100 text-red-700'
              }`}>
                {mensaje}
              </div>
            )}

            {/* Filtro y botón de exportación */}
            <div className="mt-8 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="w-full sm:w-1/2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Filtrar por Tipo de Macro:
                </label>
                <select
                  value={filtroMacro}
                  onChange={e => {
                    setFiltroMacro(e.target.value);
                    setPaginaActual(1); // Resetear a la primera página al cambiar filtro
                  }}
                  className="w-full p-2 border rounded"
                >
                  <option>Todos</option>
                  {macros.map(m => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={exportToExcel}
                className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Exportar a Excel
              </button>
            </div>

            {/* Tabla de historial */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Historial de Lecturas</h3>
              <span className="text-sm text-gray-500">
                Mostrando {registrosPaginaActual.length} de {lecturasFiltradas.length} registros
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white shadow rounded-lg">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Operario</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Fecha</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Hora</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Tipo de Macro</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Lectura (m³/día)</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {registrosPaginaActual.length > 0 ? (
                    registrosPaginaActual.map((l, idx) => (
                      <tr key={l.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-2 text-sm text-gray-800">{l.usuario}</td>
                        <td className="px-4 py-2 text-sm text-gray-800">{l.fecha}</td>
                        <td className="px-4 py-2 text-sm text-gray-800">{l.hora}</td>
                        <td className="px-4 py-2 text-sm text-gray-800">{l.tipoMacro}</td>
                        <td className="px-4 py-2 text-sm text-gray-800">{l.lectura}</td>
                        <td className="px-4 py-2 text-sm text-gray-800">
                          <button
                            onClick={() => eliminarLectura(l.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Eliminar"
                            disabled={loading}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-4 py-6 text-center text-gray-500">
                        No hay lecturas registradas
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Controles de paginación */}
            {totalPaginas > 1 && (
              <div className="flex justify-center mt-6">
                <nav className="inline-flex rounded-md shadow">
                  <button
                    onClick={() => cambiarPagina(paginaActual - 1)}
                    disabled={paginaActual === 1}
                    className="px-3 py-1 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Anterior
                  </button>
                  
                  {Array.from({ length: totalPaginas }, (_, i) => i + 1).map(numero => (
                    <button
                      key={numero}
                      onClick={() => cambiarPagina(numero)}
                      className={`px-3 py-1 border-t border-b border-gray-300 text-sm font-medium ${
                        paginaActual === numero 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {numero}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => cambiarPagina(paginaActual + 1)}
                    disabled={paginaActual === totalPaginas}
                    className="px-3 py-1 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Siguiente
                  </button>
                </nav>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default MacroLecturas;