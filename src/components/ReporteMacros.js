import React, { useState, useEffect } from "react";
import app from "../FirebaseConfiguration";
import { getDatabase, ref, onValue } from "firebase/database";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const COLORS_MACROS = {
  "Macro 8\" - Entrada Planta": "#8884d8",
  "Macro 6\" - Salida Planta": "#82ca9d",
  "Macro 4\" - Laguneta": "#ffc658",
  "Macro 4\" - General": "#ff8042"
};

function ReporteMacros() {
  const [datos, setDatos] = useState([]);
  const [macroSeleccionado, setMacroSeleccionado] = useState("Macro 8\" - Entrada Planta");
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [tipoReporte, setTipoReporte] = useState("individual");
  const [menuAbierto, setMenuAbierto] = useState(false);

  const macrosDisponibles = [
    "Macro 8\" - Entrada Planta",
    "Macro 6\" - Salida Planta",
    "Macro 4\" - Laguneta",
    "Macro 4\" - General"
  ];

  useEffect(() => {
    const db = getDatabase(app);
    const macrosRef = ref(db, "Macros/Macros");

    onValue(macrosRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const lista = Object.entries(data).map(([key, item]) => {
          // Convertir fecha local a formato ISO para filtrado
          const fechaParts = item.fecha.split('/');
          const fechaISO = fechaParts.length === 3 
            ? `${fechaParts[2]}-${fechaParts[1].padStart(2, '0')}-${fechaParts[0].padStart(2, '0')}`
            : item.fecha;
            
          return {
            id: key,
            ...item,
            fecha: item.fecha,
            fechaISO,
            fechaObj: new Date(fechaISO),
            lectura: parseFloat(item.lectura || 0),
            macro: item.tipoMacro || ""
          };
        });
        setDatos(lista);
      }
    });
  }, []);

  // Función de filtrado por fechas
  const filtrarPorFecha = (datosAFiltrar = datos) => {
    if (!fechaInicio && !fechaFin) return [];
    
    const inicio = fechaInicio ? new Date(fechaInicio) : null;
    const fin = fechaFin ? new Date(fechaFin) : null;
    
    if (inicio) inicio.setHours(0, 0, 0, 0);
    if (fin) fin.setHours(23, 59, 59, 999);

    return datosAFiltrar.filter((d) => {
      if (!d.fechaObj || isNaN(d.fechaObj.getTime())) return false;
      
      const cumpleInicio = !inicio || d.fechaObj >= inicio;
      const cumpleFin = !fin || d.fechaObj <= fin;
      
      return cumpleInicio && cumpleFin;
    });
  };

  const filtrarPorMacroYFecha = () => {
    return filtrarPorFecha().filter((d) => d.macro === macroSeleccionado);
  };

  // Preparar datos diarios para el gráfico
  const prepararDatosDiarios = (datosFiltrados, agruparPorMacro = false) => {
    if (agruparPorMacro) {
      const datosPorFecha = {};
      
      datosFiltrados.forEach((d) => {
        if (!d.fechaObj) return;
        
        const fechaKey = d.fechaObj.toISOString().split('T')[0];
        
        if (!datosPorFecha[fechaKey]) {
          datosPorFecha[fechaKey] = {
            fecha: fechaKey,
            fechaMostrar: d.fecha // Mostrar formato original
          };
        }
        
        datosPorFecha[fechaKey][d.macro] = d.lectura;
      });
      
      return Object.values(datosPorFecha).sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    } else {
      return datosFiltrados
        .map(d => ({
          fecha: d.fechaObj.toISOString().split('T')[0],
          fechaMostrar: d.fecha,
          lectura: d.lectura,
          macro: d.macro
        }))
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    }
  };

  const datosFiltrados = tipoReporte === "individual" ? filtrarPorMacroYFecha() : filtrarPorFecha();
  const datosParaGrafico = prepararDatosDiarios(datosFiltrados, tipoReporte === "conjunto");

  const calcularEstadisticas = (macro = null) => {
    let datosParaCalculo = datosFiltrados;
    
    if (macro) {
      datosParaCalculo = datosFiltrados.filter(d => d.macro === macro);
    }
    
    if (datosParaCalculo.length === 0) return { min: 0, max: 0, avg: 0 };

    const lecturas = datosParaCalculo.map((d) => d.lectura);
    const min = Math.min(...lecturas);
    const max = Math.max(...lecturas);
    const avg = lecturas.reduce((a, b) => a + b, 0) / lecturas.length;

    return {
      min: min.toFixed(2),
      max: max.toFixed(2),
      avg: avg.toFixed(2),
    };
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
        <a href="/Macros" className="block py-2 px-3 text-gray-700 hover:bg-blue-50 hover:text-red-500 rounded transition">Lecturas Macro</a>
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
          <div className="w-full max-w-5xl mx-auto">
            {/* Título */}
            <h2 className="text-2xl font-bold mb-6 text-center text-green-800">
              {tipoReporte === "individual"
                ? `Reporte Diario de Lecturas para ${macroSeleccionado}`
                : "Reporte Diario Conjunto de Todos los Macros"}
            </h2>

            {/* Filtros */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <select
                value={tipoReporte}
                onChange={(e) => setTipoReporte(e.target.value)}
                className="p-2 border rounded"
              >
                <option value="individual">Reporte Individual</option>
                <option value="conjunto">Reporte Conjunto</option>
              </select>

              {tipoReporte === "individual" && (
                <select
                  value={macroSeleccionado}
                  onChange={(e) => setMacroSeleccionado(e.target.value)}
                  className="p-2 border rounded"
                >
                  {macrosDisponibles.map(macro => (
                    <option key={macro} value={macro}>{macro}</option>
                  ))}
                </select>
              )}

              <div className="flex flex-col">
                <label className="text-sm text-gray-500 mb-1">Fecha inicio</label>
                <DatePicker
                  selected={fechaInicio}
                  onChange={(date) => setFechaInicio(date)}
                  selectsStart
                  startDate={fechaInicio}
                  endDate={fechaFin}
                  placeholderText="Seleccione fecha"
                  className="p-2 border rounded w-full"
                  dateFormat="dd/MM/yyyy"
                  isClearable
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm text-gray-500 mb-1">Fecha fin</label>
                <DatePicker
                  selected={fechaFin}
                  onChange={(date) => setFechaFin(date)}
                  selectsEnd
                  startDate={fechaInicio}
                  endDate={fechaFin}
                  minDate={fechaInicio}
                  placeholderText="Seleccione fecha"
                  className="p-2 border rounded w-full"
                  dateFormat="dd/MM/yyyy"
                  isClearable
                />
              </div>
            </div>

            {/* Gráfico y estadísticas solo si hay fechas seleccionadas */}
            {(fechaInicio || fechaFin) ? (
              datosFiltrados.length > 0 ? (
                <>
                  <div className="bg-white p-4 rounded-lg shadow mb-6">
                    <div className="h-64 sm:h-80 md:h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={datosParaGrafico}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="fechaMostrar" 
                            tickFormatter={(value) => {
                              const parts = value.split('/');
                              return parts.length === 3 ? `${parts[0]}/${parts[1]}` : value;
                            }}
                          />
                          <YAxis label={{ value: 'm³/día', angle: -90, position: 'insideLeft' }} />
                          <Tooltip 
                            formatter={(value) => [`${value} m³/día`, 'Lectura']}
                            labelFormatter={(label) => `Fecha: ${label}`}
                          />
                          <Legend />
                          {tipoReporte === "conjunto" ? (
                            macrosDisponibles.map(macro => (
                              <Line
                                key={macro}
                                type="monotone"
                                dataKey={macro}
                                stroke={COLORS_MACROS[macro]}
                                activeDot={{ r: 8 }}
                              />
                            ))
                          ) : (
                            <Line
                              type="monotone"
                              dataKey="lectura"
                              stroke={COLORS_MACROS[macroSeleccionado]}
                              name={macroSeleccionado}
                              activeDot={{ r: 8 }}
                            />
                          )}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Estadísticas */}
                  <div className="mt-6">
                    {tipoReporte === "individual" ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                        <div className="p-4 bg-gray-100 rounded shadow">
                          <p className="text-gray-500">📉 Mínimo</p>
                          <p className="text-lg font-bold">{calcularEstadisticas().min} m³/día</p>
                        </div>
                        <div className="p-4 bg-gray-100 rounded shadow">
                          <p className="text-gray-500">📈 Máximo</p>
                          <p className="text-lg font-bold">{calcularEstadisticas().max} m³/día</p>
                        </div>
                        <div className="p-4 bg-gray-100 rounded shadow">
                          <p className="text-gray-500">➗ Promedio</p>
                          <p className="text-lg font-bold">{calcularEstadisticas().avg} m³/día</p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {macrosDisponibles.map(macro => (
                          <div key={macro} className="p-4 bg-gray-100 rounded shadow">
                            <h3 className="font-bold text-center mb-2 text-sm sm:text-base">{macro}</h3>
                            <div className="grid grid-cols-3 gap-2 text-sm">
                              <div>
                                <p className="text-gray-500">Mín</p>
                                <p className="font-semibold">{calcularEstadisticas(macro).min} m³/día</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Máx</p>
                                <p className="font-semibold">{calcularEstadisticas(macro).max} m³/día</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Prom</p>
                                <p className="font-semibold">{calcularEstadisticas(macro).avg} m³/día</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-center mt-6 text-gray-500">
                  No hay datos disponibles para el rango de fechas seleccionado
                </p>
              )
            ) : (
              <div className="text-center p-8 bg-white rounded-lg shadow">
                <p className="text-gray-500 text-lg">
                  Seleccione un rango de fechas para visualizar los datos
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default ReporteMacros;