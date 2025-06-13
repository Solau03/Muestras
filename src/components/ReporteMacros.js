
import React, { useState, useEffect } from "react";
import app from "../FirebaseConfiguration";
import { getDatabase, ref, onValue } from "firebase/database";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

const COLORS_MACROS = {
  "Macro 8\" - Entrada Planta": "#8884d8",
  "Macro 6\" - Salida Planta": "#82ca9d",
  "Macro 4\" - Laguneta": "#ffc658",
  "Macro 4\" - General": "#ff8042"
};

function ReporteMacros() {
  const [datos, setDatos] = useState([]);
  const [macroSeleccionado, setMacroSeleccionado] = useState("Macro 8\" - Entrada Planta");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [tipoReporte, setTipoReporte] = useState("individual");

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
            fechaISO, // Guardamos versión ISO para filtrado
            lectura: parseFloat(item.lectura || 0),
            macro: item.tipoMacro || "",
            fechaObj: new Date(fechaISO) // Objeto Date para comparaciones
          };
        });
        setDatos(lista);
      }
    });
  }, []);

  // Función mejorada de filtrado por fechas
  const filtrarPorFecha = (datosAFiltrar = datos) => {
    if (!fechaInicio && !fechaFin) return datosAFiltrar;
    
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

  const agruparPorMes = (datosFiltrados, agruparPorMacro = false) => {
    const agrupado = {};
    
    datosFiltrados.forEach((d) => {
      if (!d.fechaObj) return;
      
      const fecha = d.fechaObj;
      const mes = `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, "0")}`;
      
      const key = agruparPorMacro ? `${d.macro}-${mes}` : mes;
      
      if (!agrupado[key]) agrupado[key] = [];
      agrupado[key].push(d.lectura);
    });

    return Object.keys(agrupado).map((key) => {
      const lecturas = agrupado[key];
      const promedio = lecturas.reduce((a, b) => a + b, 0) / lecturas.length;
      
      if (agruparPorMacro) {
        const [macro, mes] = key.split('-');
        return { macro, mes, promedio: parseFloat(promedio.toFixed(2)) };
      }
      
      return { mes: key, promedio: parseFloat(promedio.toFixed(2)) };
    });
  };

  // Resto del código permanece igual...
  const exportarAExcel = () => {
    let datosExportar;
    let nombreArchivo;
    
    if (tipoReporte === "individual") {
      datosExportar = agruparPorMes(filtrarPorMacroYFecha());
      nombreArchivo = `Reporte_${macroSeleccionado.replace(/"/g, '')}.xlsx`;
    } else {
      datosExportar = agruparPorMes(filtrarPorFecha(), true);
      nombreArchivo = `Reporte_Conjunto_Macros.xlsx`;
    }

    const hoja = XLSX.utils.json_to_sheet(datosExportar);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "PromediosPorMes");
    const excelBuffer = XLSX.write(libro, { bookType: "xlsx", type: "array" });
    const archivo = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(archivo, nombreArchivo);
  };

  const datosFiltrados = tipoReporte === "individual" ? filtrarPorMacroYFecha() : filtrarPorFecha();
  const datosAgrupados = agruparPorMes(datosFiltrados, tipoReporte === "conjunto");

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

  const prepararDatosConjuntos = () => {
    const datosPorMacro = {};
    
    macrosDisponibles.forEach(macro => {
      datosPorMacro[macro] = {};
    });

    datosFiltrados.forEach(d => {
      if (!d.fechaObj) return;
      
      const fecha = d.fechaObj;
      const mes = `${fecha.getFullYear()}-${(fecha.getMonth() + 1).toString().padStart(2, "0")}`;
      
      if (!datosPorMacro[d.macro][mes]) {
        datosPorMacro[d.macro][mes] = [];
      }
      datosPorMacro[d.macro][mes].push(d.lectura);
    });

    const mesesUnicos = new Set();
    const promediosPorMacro = {};
    
    macrosDisponibles.forEach(macro => {
      promediosPorMacro[macro] = [];
      
      Object.keys(datosPorMacro[macro]).forEach(mes => {
        mesesUnicos.add(mes);
        const promedio = datosPorMacro[macro][mes].reduce((a, b) => a + b, 0) / datosPorMacro[macro][mes].length;
        promediosPorMacro[macro].push({
          mes,
          promedio: parseFloat(promedio.toFixed(2))
        });
      });
    });

    const mesesOrdenados = Array.from(mesesUnicos).sort();
    const datosCombinados = mesesOrdenados.map(mes => {
      const dato = { mes };
      macrosDisponibles.forEach(macro => {
        const macroData = promediosPorMacro[macro].find(d => d.mes === mes);
        dato[macro] = macroData ? macroData.promedio : null;
      });
      return dato;
    });

    return datosCombinados;
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-green-100 to-blue-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md p-4">
        <h2 className="text-2xl font-bold text-blue-600 mb-6">Admin</h2>
        <nav className="space-y-4">
          <a href="/Admi" className="block text-gray-700 hover:text-blue-600">Usuarios </a>
          <a href="/Muestras" className="block text-gray-700 hover:text-blue-600">Muestras Calidad</a>
          <a href="/Muestrasreportes" className="block text-gray-700 hover:text-blue-600">Reportes calidad</a>
          <a href="/AdmiOrden" className="block text-gray-700 hover:text-blue-600">Órdenes Reparación</a>
          <a href="/Macros" className="block text-gray-700 hover:text-red-500">Lecturas Macro</a>
          <a href="/ReporteMacros" className="block text-gray-700 hover:text-red-500">Reportes Macro</a>
        </nav>
      </aside>

      {/* Contenido derecho */}
      <div className="flex-1 p-8 overflow-auto">
        <div className="w-full max-w-5xl mx-auto">
          {/* Título */}
          <h2 className="text-2xl font-bold mb-6 text-center text-green-800">
            {tipoReporte === "individual"
              ? `Reporte de Lecturas para ${macroSeleccionado}`
              : "Reporte Conjunto de Todos los Macros"}
          </h2>

          {/* Filtros */}
          <div className="grid md:grid-cols-5 gap-4 mb-6">
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

            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => {
                console.log("Fecha inicio seleccionada:", e.target.value);
                setFechaInicio(e.target.value);
              }}
              className="p-2 border rounded"
              placeholder="Fecha inicio"
            />
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => {
                console.log("Fecha fin seleccionada:", e.target.value);
                setFechaFin(e.target.value);
              }}
              className="p-2 border rounded"
              placeholder="Fecha fin"
            />
            <button
              onClick={exportarAExcel}
              className="bg-green-600 text-white p-2 rounded hover:bg-green-700"
            >
              Exportar a Excel
            </button>
          </div>

          {/* Gráfico */}
          {datosFiltrados.length > 0 ? (
            <>
              <div className="bg-white p-4 rounded-lg shadow mb-6">
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart
                    data={tipoReporte === "conjunto" ? prepararDatosConjuntos() : datosAgrupados}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis label={{ value: 'm³/día', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
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
                        dataKey="promedio"
                        stroke={COLORS_MACROS[macroSeleccionado]}
                        name={macroSeleccionado}
                        activeDot={{ r: 8 }}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Estadísticas */}
              <div className="mt-6">
                {tipoReporte === "individual" ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
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
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {macrosDisponibles.map(macro => (
                      <div key={macro} className="p-4 bg-gray-100 rounded shadow">
                        <h3 className="font-bold text-center mb-2">{macro}</h3>
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
              {datos.length === 0
                ? "No hay datos registrados en la base de datos"
                : "No hay datos disponibles para el filtro seleccionado"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReporteMacros;