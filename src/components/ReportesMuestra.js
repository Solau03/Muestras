import React, { useState, useEffect, useRef } from "react";
import app from "../FirebaseConfiguration";
import { getDatabase, ref, onValue } from "firebase/database";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer } from "recharts";

const ITEMS = [
  { key: "Ph", label: "pH", color: "#8884d8" },
  { key: "Turbiedad", label: "Turbiedad", color: "#82ca9d" },
  { key: "Color", label: "Color", color: "#ffc658" },
  { key: "Cloro", label: "Cloro", color: "#ff7300" },
];

function Reporte() {
  const [muestras, setMuestras] = useState([]);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [itemsSeleccionados, setItemsSeleccionados] = useState(["Ph"]);
  const [datosFiltrados, setDatosFiltrados] = useState([]);
  const [menuAbierto, setMenuAbierto] = useState(false);

  const db = getDatabase(app);
  const reporteRef = useRef();

  useEffect(() => {
    const muestrasRef = ref(db, "muestras/muestras");
    onValue(muestrasRef, (snapshot) => {
      const data = snapshot.val();
      const lista = data ? Object.values(data) : [];
      setMuestras(lista);
    });
  }, [db]);

  const filtrarDatos = () => {
    if (!fechaInicio || !fechaFin) {
      alert("Selecciona el rango de fechas");
      return;
    }

    const [ai, mi, di] = fechaInicio.split("-");
    const [af, mf, df] = fechaFin.split("-");
    const fechaIni = new Date(`${ai}-${mi}-${di}`);
    const fechaFin_ = new Date(`${af}-${mf}-${df}T23:59:59`);

    const filtrados = muestras.filter((m) => {
      if (!m.Fecha) return false;

      const [d, m_, a] = m.Fecha.split("/").map((v) => v.padStart(2, "0"));
      const fechaMuestra = new Date(`${a}-${m_}-${d}`);

      return fechaMuestra >= fechaIni && fechaMuestra <= fechaFin_;
    });

    setDatosFiltrados(filtrados);
  };

  const toggleItem = (key) => {
    if (itemsSeleccionados.includes(key)) {
      setItemsSeleccionados(itemsSeleccionados.filter((i) => i !== key));
    } else {
      setItemsSeleccionados([...itemsSeleccionados, key]);
    }
  };

  const getDatosGrafico = (itemKey) =>
    datosFiltrados
      .filter((d) => d[itemKey] !== undefined && d[itemKey] !== null && !isNaN(parseFloat(d[itemKey])))
      .map((m) => ({
        fecha: m.Fecha + " " + (m.Hora || ""),
        valor: parseFloat(m[itemKey]),
        [itemKey]: parseFloat(m[itemKey])
      }));

  const calculosEstadisticos = (itemKey) => {
    const valores = getDatosGrafico(itemKey).map((d) => d.valor);
    if (valores.length === 0) return { max: "-", min: "-", avg: "-" };

    const max = Math.max(...valores).toFixed(2);
    const min = Math.min(...valores).toFixed(2);
    const avg = (valores.reduce((a, b) => a + b, 0) / valores.length).toFixed(2);
    return { max, min, avg };
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-green-100 to-blue-100">
      {/* Overlay para móviles cuando el menú está abierto */}
      {menuAbierto && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setMenuAbierto(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed md:relative z-30 md:z-0 w-64 bg-white shadow-md p-6 transform transition-transform duration-300 ease-in-out ${
        menuAbierto ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <h2 className="text-2xl font-bold text-blue-600 mb-6">Admin</h2>
        <nav className="space-y-4">
          <a href="/Admi" className="block text-gray-700 hover:text-blue-600">Usuarios</a>
          <a href="/Muestras" className="block text-gray-700 hover:text-blue-600">Muestras Calidad</a>
          <a href="/Muestrasreportes" className="block text-gray-700 hover:text-blue-600">Reportes calidad</a>
          <a href="/AdmiOrden" className="block text-gray-700 hover:text-blue-600">Órdenes Reparación</a>
          <a href="/Macros" className="block text-gray-700 hover:text-red-500">Lecturas Macro</a>
          <a href="/ReporteMacros" className="block text-gray-700 hover:text-red-500">Reportes Macro</a>
        </nav>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 p-4 md:p-8 overflow-auto relative">
        {/* Mobile menu button */}
        <button 
          className="md:hidden fixed top-4 left-4 z-40 bg-blue-600 text-white p-2 rounded-full shadow-lg"
          onClick={() => setMenuAbierto(!menuAbierto)}
        >
          {menuAbierto ? '✕' : '☰'}
        </button>

        <div className="max-w-6xl mx-auto">
          {/* Encabezado */}
          <div className="text-center mb-6 mt-12 md:mt-0">
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">Reporte de Muestras</h2>
            <p className="mt-2 text-sm text-gray-600">Análisis de calidad del agua</p>
          </div>

          {/* Filtros en barra horizontal */}
          <div className="bg-white shadow rounded-lg p-4 md:p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              {/* Fecha Inicio */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Desde:</label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Fecha Fin */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Hasta:</label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Items a graficar */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Parámetros:</label>
                <div className="flex flex-wrap gap-2">
                  {ITEMS.map(({ key, label, color }) => (
                    <button
                      key={key}
                      onClick={() => toggleItem(key)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        itemsSeleccionados.includes(key)
                          ? "bg-blue-600 text-white border border-blue-600"
                          : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botón de filtrar */}
              <div>
                <button
                  onClick={filtrarDatos}
                  className="w-full md:w-auto px-4 md:px-6 py-2 md:py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  Generar Reporte
                </button>
              </div>
            </div>
          </div>

          {/* Resultados */}
          <div ref={reporteRef} className="bg-white shadow rounded-lg p-4 md:p-6">
            {datosFiltrados.length > 0 ? (
              <>
                {itemsSeleccionados.length === 0 && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700">Selecciona al menos un parámetro para mostrar.</p>
                      </div>
                    </div>
                  </div>
                )}

                {itemsSeleccionados.map((itemKey) => {
                  const datosGrafico = getDatosGrafico(itemKey);
                  const { max, min, avg } = calculosEstadisticos(itemKey);
                  const itemInfo = ITEMS.find((i) => i.key === itemKey);

                  return (
                    <div key={itemKey} className="mb-8 last:mb-0">
                      <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">{itemInfo.label}</h3>
                      
                      {datosGrafico.length > 0 ? (
                        <>
                          <div className="h-64 md:h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart
                                data={datosGrafico}
                                margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis 
                                  dataKey="fecha" 
                                  angle={-45} 
                                  textAnchor="end" 
                                  interval={0}
                                  tick={{ fontSize: 10 }}
                                />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line
                                  type="monotone"
                                  dataKey={itemKey}
                                  name={itemInfo.label}
                                  stroke={itemInfo.color}
                                  strokeWidth={2}
                                  activeDot={{ r: 6 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>

                          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-sm font-medium text-gray-500">Máximo</p>
                              <p className="text-xl md:text-2xl font-semibold text-gray-900">{max}</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-sm font-medium text-gray-500">Mínimo</p>
                              <p className="text-xl md:text-2xl font-semibold text-gray-900">{min}</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-sm font-medium text-gray-500">Promedio</p>
                              <p className="text-xl md:text-2xl font-semibold text-gray-900">{avg}</p>
                            </div>
                          </div>

                          {/* Alertas específicas para pH */}
                          {itemKey === "Ph" && (
                            <div className="mt-3 space-y-2">
                              {min !== "-" && parseFloat(min) < 6.5 && (
                                <div className="flex items-start bg-red-50 p-3 rounded-lg border-l-4 border-red-500">
                                  <svg className="h-5 w-5 text-red-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                  </svg>
                                  <p className="text-sm font-medium text-red-700">Alerta: pH mínimo por debajo de 6.5 (ácido)</p>
                                </div>
                              )}
                              {max !== "-" && parseFloat(max) > 9 && (
                                <div className="flex items-start bg-red-50 p-3 rounded-lg border-l-4 border-red-500">
                                  <svg className="h-5 w-5 text-red-500 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                  </svg>
                                  <p className="text-sm font-medium text-red-700">Alerta: pH máximo por encima de 9 (básico)</p>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-6">
                          <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="mt-2 text-sm font-medium text-gray-900">No hay datos para este parámetro en el rango seleccionado</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No se encontraron datos</h3>
                <p className="mt-1 text-sm text-gray-500">No hay registros para mostrar en el rango de fechas seleccionado.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Reporte;