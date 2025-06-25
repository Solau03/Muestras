import React, { useState, useEffect } from "react";
import app from "../FirebaseConfiguration";
import { getDatabase, ref, set, push, onValue, remove } from "firebase/database";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

function Muestras() {
  const [turbiedad, setTurbiedad] = useState("");
  const [ph, setPh] = useState("");
  const [color, setColor] = useState("");
  const [cloro, setCloro] = useState("");
  const [muestras, setMuestras] = useState([]);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [muestraAEliminar, setMuestraAEliminar] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Estados para manejar errores de validación
  const [errores, setErrores] = useState({
    turbiedad: false,
    ph: false,
    color: false,
    cloro: false,
    formato: false
  });

  const db = getDatabase(app);

  useEffect(() => {
    const cargarMuestras = () => {
      setLoading(true);
      const muestrasRef = ref(db, "muestras/muestras");

      const unsubscribe = onValue(muestrasRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const lista = Object.entries(data).map(([id, muestra]) => ({
            id,
            ...muestra
          })).reverse();
          setMuestras(lista);
        } else {
          setMuestras([]);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    };

    cargarMuestras();
  }, [db]);

  const validarDatos = () => {
    const phNum = parseFloat(ph);
    const turbNum = parseFloat(turbiedad);
    const colorNum = parseFloat(color);
    const cloroNum = parseFloat(cloro);

    const nuevosErrores = {
      turbiedad: isNaN(turbNum) || turbNum > 2,
      ph: isNaN(phNum) || phNum < 6.5 || phNum > 9,
      color: isNaN(colorNum) || colorNum > 15,
      cloro: isNaN(cloroNum) || cloroNum < 0.3 || cloroNum > 2.0,
      formato: isNaN(phNum) || isNaN(turbNum) || isNaN(colorNum) || isNaN(cloroNum)
    };

    setErrores(nuevosErrores);
    
    // Retorna true si no hay errores
    return !Object.values(nuevosErrores).some(error => error);
  };

  const guardarDatos = async () => {
    if (!validarDatos()) {
      return;
    }

    const nombreUsuario = localStorage.getItem("nombreUsuario") || "Desconocido";
    const fecha = new Date().toLocaleDateString();
    const hora = new Date().toLocaleTimeString();

    const newDocRef = push(ref(db, "muestras/muestras"));

    set(newDocRef, {
      nombreUsuario,
      Turbiedad: turbiedad,
      Ph: ph,
      Cloro: cloro,
      Color: color,
      Fecha: fecha,
      Hora: hora
    })
      .then(() => {
        alert("Se registró la muestra exitosamente");
        setTurbiedad("");
        setPh("");
        setColor("");
        setCloro("");
        setErrores({
          turbiedad: false,
          ph: false,
          color: false,
          cloro: false,
          formato: false
        });
      })
      .catch((error) => {
        alert("Error: " + error.message);
      });
  };

  const eliminarMuestra = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar esta muestra?")) return;
    
    try {
      await remove(ref(db, `muestras/muestras/${id}`));
      setMuestraAEliminar(null);
    } catch (error) {
      console.error("Error al eliminar muestra:", error);
      alert("Ocurrió un error al eliminar la muestra");
    }
  };

  const exportToExcel = () => {
    const dataToExport = muestras.map(muestra => ({
      "Usuario": muestra.nombreUsuario,
      "Turbiedad (NTU)": muestra.Turbiedad,
      "pH": muestra.Ph,
      "Cloro (mg/L)": muestra.Cloro,
      "Color (UC)": muestra.Color,
      "Fecha": muestra.Fecha,
      "Hora": muestra.Hora
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "MuestrasCalidad");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, `MuestrasCalidad_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
     <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      {/* Sidebar (similar al que tienes en AdmiNivelTanque) */}
      <aside className={`fixed md:sticky top-0 z-30 md:z-0 w-64 bg-white shadow-md p-4 h-screen md:h-auto`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-blue-600">Reportes</h2>
        </div>
        <nav className="space-y-2">
        <a href="/Admi" className="block py-2 px-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded transition">Usuarios</a>
        <a href="/Muestras" className="block py-2 px-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded transition">Muestras Calidad</a>
        <a href="/Muestrasreportes" className="block py-2 px-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded transition">Reportes calidad</a>
        <a href="/AdmiTanque" className="block py-2 px-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded transition">Lecturas Tanque</a>
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
        <div className="max-w-6xl mx-auto">
  <div className="p-6 text-center">
    <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800">Registro de Muestras</h2>
    <p className="mt-2 text-sm text-green-600">Ingrese los parámetros de calidad del agua</p>
  </div>
</div>

        {/* Formulario mejorado */}
        <div className="bg-white shadow-lg rounded-xl p-6 mb-8 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Nueva Muestra</h3>
          
          {errores.formato && (
            <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700">
              <p>Todos los campos deben ser números válidos.</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label htmlFor="turbiedad" className="block text-sm font-medium text-gray-700">Turbiedad (NTU)</label>
              <input
                type="number"
                step="0.1"
                id="turbiedad"
                placeholder="Ej: 1.5"
                value={turbiedad}
                onChange={(e) => setTurbiedad(e.target.value)}
                className={`w-full px-4 py-2 border ${errores.turbiedad ? 'border-red-500 bg-red-50' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition`}
              />
              <p className={`text-xs ${errores.turbiedad ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                Máximo permitido: 2 NTU
              </p>
            </div>
            
            <div className="space-y-1">
              <label htmlFor="ph" className="block text-sm font-medium text-gray-700">pH</label>
              <input
                type="number"
                step="0.1"
                id="ph"
                placeholder="Ej: 7.2"
                value={ph}
                onChange={(e) => setPh(e.target.value)}
                className={`w-full px-4 py-2 border ${errores.ph ? 'border-red-500 bg-red-50' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition`}
              />
              <p className={`text-xs ${errores.ph ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                Rango permitido: 6.5 - 9
              </p>
            </div>
            
            <div className="space-y-1">
              <label htmlFor="cloro" className="block text-sm font-medium text-gray-700">Cloro (mg/L)</label>
              <input
                type="number"
                step="0.1"
                id="cloro"
                placeholder="Ej: 1.2"
                value={cloro}
                onChange={(e) => setCloro(e.target.value)}
                className={`w-full px-4 py-2 border ${errores.cloro ? 'border-red-500 bg-red-50' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition`}
              />
              <p className={`text-xs ${errores.cloro ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                Rango permitido: 0.3 - 2.0 mg/L
              </p>
            </div>
            
            <div className="space-y-1">
              <label htmlFor="color" className="block text-sm font-medium text-gray-700">Color (UC)</label>
              <input
                type="number"
                step="1"
                id="color"
                placeholder="Ej: 10"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className={`w-full px-4 py-2 border ${errores.color ? 'border-red-500 bg-red-50' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition`}
              />
              <p className={`text-xs ${errores.color ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                Máximo permitido: 15 UC
              </p>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={guardarDatos}
              className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors shadow-md"
            >
              Guardar Muestra
            </button>
          </div>
        </div>

        {/* Tabla de muestras mejorada */}
        <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-center px-6 py-4 border-b border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-2 md:mb-0">Historial de Muestras</h3>
            <button
              onClick={exportToExcel}
              className={`px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow ${muestras.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={muestras.length === 0}
            >
              Exportar a Excel
            </button>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Turbiedad</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">pH</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cloro</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha/Hora</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {muestras.length > 0 ? (
                    muestras.map((muestra) => (
                      <tr key={muestra.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{muestra.nombreUsuario}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{muestra.Turbiedad} NTU</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{muestra.Ph}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{muestra.Cloro} mg/L</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{muestra.Color} UC</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="font-medium">{muestra.Fecha}</div>
                          <div className="text-xs text-gray-400">{muestra.Hora}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => setMuestraAEliminar(muestra)}
                            className="text-red-600 hover:text-red-900 font-medium flex items-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-4 text-center text-gray-400">
                        No hay muestras registradas
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal de confirmación mejorado */}
        {muestraAEliminar && (
          <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Confirmar eliminación</h3>
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                <p className="text-red-700">¿Estás seguro de eliminar esta muestra?</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="font-medium text-gray-700">Usuario:</div>
                <div className="text-gray-900">{muestraAEliminar.nombreUsuario}</div>
                
                <div className="font-medium text-gray-700">Turbiedad:</div>
                <div className="text-gray-900">{muestraAEliminar.Turbiedad} NTU</div>
                
                <div className="font-medium text-gray-700">pH:</div>
                <div className="text-gray-900">{muestraAEliminar.Ph}</div>
                
                <div className="font-medium text-gray-700">Cloro:</div>
                <div className="text-gray-900">{muestraAEliminar.Cloro} mg/L</div>
                
                <div className="font-medium text-gray-700">Color:</div>
                <div className="text-gray-900">{muestraAEliminar.Color} UC</div>
                
                <div className="font-medium text-gray-700">Fecha:</div>
                <div className="text-gray-900">{muestraAEliminar.Fecha} {muestraAEliminar.Hora}</div>
              </div>
              
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setMuestraAEliminar(null)}
                  className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => eliminarMuestra(muestraAEliminar.id)}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Muestras;