import React, { useState, useEffect } from "react";
import app from "../FirebaseConfiguration";
import { getDatabase, ref, push, set, onValue, remove } from "firebase/database";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";



function AdmiNivelTanque() {
  const [nivel, setNivel] = useState("");
  const [registros, setRegistros] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [filtroUsuario, setFiltroUsuario] = useState("Todos");
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [ordenarPor, setOrdenarPor] = useState("fecha");
  const [ordenAscendente, setOrdenAscendente] = useState(false);

  const db = getDatabase(app);

  // Cargar registros iniciales
  useEffect(() => {
    setCargando(true);
    const registrosRef = ref(db, "nivelTanque/registros");
    const unsubscribe = onValue(registrosRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const listaConIds = Object.entries(data).map(([id, registro]) => ({
          id,
          ...registro
        }));
        setRegistros(listaConIds);
      } else {
        setRegistros([]);
      }
      setCargando(false);
    });
    return () => unsubscribe();
  }, [db]);

  // Guardar nuevo registro
  const guardarRegistro = async () => {
    const valor = parseFloat(nivel);
    if (isNaN(valor)) {
      setMensaje("⚠️ Ingrese un valor numérico válido");
      return;
    }

    if (valor < 0) {
      setMensaje("⚠️ El valor no puede ser negativo");
      return;
    }

    const usuario = localStorage.getItem("nombreUsuario") || "Desconocido";
    const fecha = new Date().toLocaleDateString("es-CO");
    const hora = new Date().toLocaleTimeString("es-CO", { hour: '2-digit', minute: '2-digit' });

    try {
      setCargando(true);
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
    } finally {
      setCargando(false);
    }
  };

  // Eliminar registro
  // Eliminar registro
const eliminarRegistro = (id) => {
  const confirmar = window.confirm('¿Está seguro que desea eliminar este registro?');
  
  if (confirmar) {
    const eliminar = async () => {
      try {
        setCargando(true);
        await remove(ref(db, `nivelTanque/registros/${id}`));
        setMensaje("✅ Registro eliminado exitosamente");
        setTimeout(() => setMensaje(""), 3000);
      } catch (error) {
        setMensaje("❌ Error al eliminar: " + error.message);
      } finally {
        setCargando(false);
      }
    };
    
    eliminar();
  }
};

  // Obtener lista de usuarios únicos
  const usuarios = [...new Set(registros.map(r => r.usuario))];

  // Filtrar y ordenar registros
  const registrosFiltrados = registros
    .filter(registro => filtroUsuario === "Todos" || registro.usuario === filtroUsuario)
    .sort((a, b) => {
      if (ordenarPor === "fecha" || ordenarPor === "hora") {
        return ordenAscendente 
          ? a.timestamp - b.timestamp 
          : b.timestamp - a.timestamp;
      } else {
        return ordenAscendente
          ? a[ordenarPor]?.toString().localeCompare(b[ordenarPor]?.toString())
          : b[ordenarPor]?.toString().localeCompare(a[ordenarPor]?.toString());
      }
    });

  // Exportar a Excel
  const exportarExcel = () => {
    const data = registrosFiltrados.map(registro => ({
      "Usuario": registro.usuario,
      "Fecha": registro.fecha,
      "Hora": registro.hora,
      "Nivel (m)": registro.nivel
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "NivelTanque");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, `NivelTanque_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Función para cambiar el orden
  const cambiarOrden = (campo) => {
    if (ordenarPor === campo) {
      setOrdenAscendente(!ordenAscendente);
    } else {
      setOrdenarPor(campo);
      setOrdenAscendente(false);
    }
  };

  // Icono de ordenación
  const IconoOrden = ({ campo }) => (
    <span className="ml-1">
      {ordenarPor === campo ? (
        ordenAscendente ? '↑' : '↓'
      ) : null}
    </span>
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      {/* Overlay para móviles */}
      {menuAbierto && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setMenuAbierto(false)}
          aria-hidden="true"
        />
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
            aria-label="Cerrar menú"
          >
            ×
          </button>
        </div>
        <nav className="space-y-2">
        <a href="/Admi" className="block py-2 px-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded transition">Usuarios</a>
        <a href="/Muestras" className="block py-2 px-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded transition">Muestras Calidad</a>
        <a href="/Muestrasreportes" className="block py-2 px-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded transition">Reportes calidad</a>
       
        <a href="/ReporteTanque" className="block py-2 px-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded transition">Reportes Tanque</a>
        <a href="/AdmiOrden" className="block py-2 px-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded transition">Ordenes Reparación</a>
        <a href="/Macros" className="block py-2 px-3 text-gray-700 hover:bg-blue-50 hover:text-red-500 rounded transition">Lecturas Macro</a>
        <a href="/ReporteMacros" className="block py-2 px-3 text-gray-700 hover:bg-blue-50 hover:text-red-500 rounded transition">Reportes Macro</a>
        <a href="/AdmiBocatoma" className="block py-2 px-3 text-gray-700 hover:bg-blue-50 hover:text-red-500 rounded transition">Visita Bocatoma</a>
        <a href="/AdmiManzano" className="block py-2 px-3 text-gray-700 hover:bg-blue-50 hover:text-red-500 rounded transition">Muestras Manzano</a>
        <a href="/ReportesManzano" className="block py-2 px-3 text-gray-700 hover:bg-blue-50 hover:text-red-500 rounded transition">Reportes Manzano</a>
      </nav>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 p-4 md:p-6">
        <button 
          className="md:hidden fixed top-4 left-4 z-40 bg-blue-600 text-white p-2 rounded-full shadow-lg"
          onClick={() => setMenuAbierto(!menuAbierto)}
          aria-label="Abrir menú"
        >
          {menuAbierto ? '✕' : '☰'}
        </button>

        <div className="max-w-6xl mx-auto bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Registro de Nivel de Tanque</h2>
            
            {/* Formulario de registro */}
            <div className="mb-8 p-4 border rounded-lg bg-blue-50">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label htmlFor="nivel-tanque" className="block text-sm font-medium text-gray-700 mb-1">
                    Nivel del Tanque (m)
                  </label>
                  <input
                    id="nivel-tanque"
                    type="number"
                    min="0"
                    step="0.1"
                    value={nivel}
                    onChange={(e) => setNivel(e.target.value)}
                    className="w-full px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: 150"
                    aria-describedby="nivel-help"
                    disabled={cargando}
                  />
                  <p id="nivel-help" className="mt-1 text-sm text-gray-500">
                    Ingrese el nivel en metros
                  </p>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={guardarRegistro}
                    className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                    disabled={cargando}
                  >
                    {cargando ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Procesando...
                      </>
                    ) : 'Registrar'}
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

            {/* Filtros y exportación */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div className="w-full md:w-64">
                <label htmlFor="filtro-usuario" className="block text-sm font-medium text-gray-700 mb-1">
                  Filtrar por usuario:
                </label>
                <select
                  id="filtro-usuario"
                  value={filtroUsuario}
                  onChange={(e) => setFiltroUsuario(e.target.value)}
                  className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                  disabled={cargando}
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
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2 w-full md:w-auto justify-center"
                disabled={cargando || registrosFiltrados.length === 0}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Exportar a Excel
              </button>
            </div>

            {/* Tabla de registros */}
            <div className="overflow-x-auto">
              {cargando && registros.length === 0 ? (
                <div className="flex justify-center items-center py-12">
                  <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => cambiarOrden("usuario")}
                      >
                        <div className="flex items-center">
                          Usuario
                          <IconoOrden campo="usuario" />
                        </div>
                      </th>
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => cambiarOrden("fecha")}
                      >
                        <div className="flex items-center">
                          Fecha
                          <IconoOrden campo="fecha" />
                        </div>
                      </th>
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => cambiarOrden("hora")}
                      >
                        <div className="flex items-center">
                          Hora
                          <IconoOrden campo="hora" />
                        </div>
                      </th>
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => cambiarOrden("nivel")}
                      >
                        <div className="flex items-center">
                          Nivel (m)
                          <IconoOrden campo="nivel" />
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {registrosFiltrados.length > 0 ? (
                      registrosFiltrados.map((registro, index) => (
                        <tr key={registro.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{registro.usuario}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{registro.fecha}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{registro.hora}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {registro.nivel} m
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => eliminarRegistro(registro.id)}
                              className="text-red-600 hover:text-red-900 disabled:text-gray-400 disabled:cursor-not-allowed"
                              title="Eliminar registro"
                              disabled={cargando}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                          {registros.length === 0 ? "No hay registros disponibles" : "No hay resultados para el filtro aplicado"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdmiNivelTanque;