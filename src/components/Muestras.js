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

  const db = getDatabase(app);

  useEffect(() => {
    const cargarMuestras = () => {
      setLoading(true);
      const muestrasRef = ref(db, "muestras/muestras");

      const unsubscribe = onValue(muestrasRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          // Convertir objeto a array manteniendo el ID
          const lista = Object.entries(data).map(([id, muestra]) => ({
            id,
            ...muestra
          })).reverse(); // Para mostrar las más recientes arriba
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

  const guardarDatos = async () => {
    const nombreUsuario = localStorage.getItem("nombreUsuario") || "Desconocido";
    const fecha = new Date().toLocaleDateString();
    const hora = new Date().toLocaleTimeString();

    // Validar que los campos sean números válidos
    const phNum = parseFloat(ph);
    const turbNum = parseFloat(turbiedad);
    const colorNum = parseFloat(color);
    const cloroNum = parseFloat(cloro);

    if (isNaN(phNum) || isNaN(turbNum) || isNaN(colorNum) || isNaN(cloroNum)) {
      alert("Todos los campos deben ser números válidos.");
      return;
    }

    // Validaciones de rangos
    if (!(phNum >= 6.5 && phNum <= 9)) {
      alert("El pH debe estar entre 6.5 y 9.");
      return;
    }
    if (!(turbNum <= 2)) {
      alert("La turbiedad debe ser menor o igual a 2.");
      return;
    }
    if (!(colorNum <= 15)) {
      alert("El color debe ser menor o igual a 15.");
      return;
    }
    if (!(cloroNum >= 0.3 && cloroNum <= 2.0)) {
      alert("El cloro debe estar entre 0.3 y 2.0.");
      return;
    }

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
    <div className="flex min-h-screen bg-gradient-to-br from-white-100 to-white-100">
      {/* Overlay para móviles cuando el menú está abierto */}
      {menuAbierto && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setMenuAbierto(false)}
        ></div>
      )}

      {/* Sidebar - Ahora con animación y control de visibilidad */}
      <aside className={`fixed md:relative z-30 md:z-0 w-64 bg-green-600 shadow-md p-4 transform transition-transform duration-300 ease-in-out ${
        menuAbierto ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <h2 className="text-2xl font-bold text-white mb-6">Admin</h2>
        <nav className="space-y-4">
          <a href="/Admi" className="block text-white hover:text-blue-200">Usuarios</a>
          <a href="/Muestras" className="block text-white hover:text-blue-200 font-semibold">Muestras Calidad</a>
          <a href="/Muestrasreportes" className="block text-white hover:text-blue-200">Reportes calidad</a>
          <a href="/AdmiOrden" className="block text-white hover:text-blue-200">Órdenes Reparación</a>
          <a href="/Macros" className="block text-white hover:text-red-200">Lecturas Macro</a>
          <a href="/ReporteMacros" className="block text-white hover:text-red-200">Reportes Macro</a>
        </nav>
      </aside>

      {/* Contenido principal */}
      <div className="flex-1 p-4 md:p-8 overflow-auto relative">
        {/* Mobile menu button */}
        <button 
          className="md:hidden fixed top-4 left-4 z-40 bg-green-600 text-white p-2 rounded-full shadow-lg"
          onClick={() => setMenuAbierto(!menuAbierto)}
        >
          {menuAbierto ? '✕' : '☰'}
        </button>

        {/* Encabezado */}
        <div className="text-center mb-8 mt-12 md:mt-0">
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800">Registro de Muestras</h2>
          <p className="mt-2 text-sm text-blue-700">Ingrese los parámetros de calidad del agua</p>
        </div>

        {/* Formulario */}
        <div className="bg-white shadow rounded-lg p-4 md:p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <label htmlFor="turbiedad" className="block text-sm font-medium text-gray-700 mb-1">Turbiedad</label>
              <input
                type="text"
                id="turbiedad"
                placeholder="Ej: 2.5 NTU"
                value={turbiedad}
                onChange={(e) => setTurbiedad(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="ph" className="block text-sm font-medium text-gray-700 mb-1">pH</label>
              <input
                type="text"
                id="ph"
                placeholder="Ej: 7.2"
                value={ph}
                onChange={(e) => setPh(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="cloro" className="block text-sm font-medium text-gray-700 mb-1">Cloro</label>
              <input
                type="text"
                id="cloro"
                placeholder="Ej: 1.8 mg/L"
                value={cloro}
                onChange={(e) => setCloro(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <input
                type="text"
                id="color"
                placeholder="Ej: 10 UC"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <button
              onClick={guardarDatos}
              className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Guardar Datos
            </button>
          </div>
        </div>

        {/* Tabla de muestras y botón de exportación */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-4">
          <div className="flex flex-col md:flex-row justify-between items-center px-4 md:px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-2 md:mb-0">Muestras registradas</h3>
            <button
              onClick={exportToExcel}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              disabled={muestras.length === 0}
            >
              Exportar a Excel
            </button>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                    <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Turbiedad</th>
                    <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">pH</th>
                    <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cloro</th>
                    <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                    <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha/Hora</th>
                    <th scope="col" className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {muestras.length > 0 ? (
                    muestras.map((muestra) => (
                      <tr key={muestra.id} className="hover:bg-gray-50">
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900">{muestra.nombreUsuario}</td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{muestra.Turbiedad}</td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{muestra.Ph}</td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{muestra.Cloro}</td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">{muestra.Color}</td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>{muestra.Fecha}</div>
                          <div className="text-xs text-gray-400">{muestra.Hora}</div>
                        </td>
                        <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => setMuestraAEliminar(muestra)}
                            className="text-red-600 hover:text-red-900"
                            title="Eliminar muestra"
                          >
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

        {/* Modal de confirmación para eliminar */}
        {muestraAEliminar && (
          <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">Confirmar eliminación</h3>
              <p className="mb-4">¿Estás seguro de eliminar la muestra del usuario <strong>{muestraAEliminar.nombreUsuario}</strong>?</p>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div className="font-medium">Turbiedad:</div>
                <div>{muestraAEliminar.Turbiedad} NTU</div>
                <div className="font-medium">pH:</div>
                <div>{muestraAEliminar.Ph}</div>
                <div className="font-medium">Cloro:</div>
                <div>{muestraAEliminar.Cloro} mg/L</div>
                <div className="font-medium">Color:</div>
                <div>{muestraAEliminar.Color} UC</div>
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => setMuestraAEliminar(null)}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => eliminarMuestra(muestraAEliminar.id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Muestras;