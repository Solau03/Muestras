import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getDatabase, ref, query, orderByChild, startAt, endAt, onValue } from 'firebase/database';
import app from '../FirebaseConfiguration';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const ReportesManzano = () => {
  const [fechaInicio, setFechaInicio] = useState(new Date());
  const [fechaFin, setFechaFin] = useState(new Date());
  const [datosPH, setDatosPH] = useState([]);
  const [datosCloro, setDatosCloro] = useState([]);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [reporteGenerado, setReporteGenerado] = useState(false);
  const [estadisticas, setEstadisticas] = useState({
    ph: { min: 0, max: 0, promedio: 0 },
    cloro: { min: 0, max: 0, promedio: 0 }
  });

  // Formatear fecha para Firebase
  const formatearFecha = (fecha) => {
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const año = fecha.getFullYear();
    return `${dia}/${mes}/${año}`;
  };

  // Convertir fecha string a objeto Date
  const parsearFecha = (fechaStr) => {
    const [dia, mes, año] = fechaStr.split('/');
    return new Date(`${mes}/${dia}/${año}`);
  };

  // Obtener datos de Firebase
  const obtenerDatos = () => {
    setCargando(true);
    const db = getDatabase(app);
    
    // Ajustar fechas para incluir todo el día
    const inicio = new Date(fechaInicio);
    inicio.setHours(0, 0, 0, 0);
    
    const fin = new Date(fechaFin);
    fin.setHours(23, 59, 59, 999);
    
    const refPHCloro = query(
      ref(db, 'registrosPHCloro'),
      orderByChild('timestamp'),
      startAt(inicio.getTime()),
      endAt(fin.getTime())
    );

    onValue(refPHCloro, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const registros = Object.values(data)
          .map(registro => ({
            ...registro,
            fechaCompleta: `${registro.fecha} ${registro.hora}`,
            fechaDate: parsearFecha(registro.fecha)
          }))
          .sort((a, b) => a.timestamp - b.timestamp);

        setDatosPH(registros.map(r => ({
          fecha: r.fechaCompleta,
          valor: r.ph,
          ubicacion: `${r.ubicacion.lat}, ${r.ubicacion.lng}`
        })));

        setDatosCloro(registros.map(r => ({
          fecha: r.fechaCompleta,
          valor: r.cloro,
          ubicacion: `${r.ubicacion.lat}, ${r.ubicacion.lng}`
        })));

        // Calcular estadísticas
        if (registros.length > 0) {
          const phValues = registros.map(r => r.ph);
          const cloroValues = registros.map(r => r.cloro);
          
          setEstadisticas({
            ph: {
              min: Math.min(...phValues),
              max: Math.max(...phValues),
              promedio: (phValues.reduce((a, b) => a + b, 0) / phValues.length)
            },
            cloro: {
              min: Math.min(...cloroValues),
              max: Math.max(...cloroValues),
              promedio: (cloroValues.reduce((a, b) => a + b, 0) / cloroValues.length)
            }
          });
        }
      } else {
        setDatosPH([]);
        setDatosCloro([]);
        setEstadisticas({
          ph: { min: 0, max: 0, promedio: 0 },
          cloro: { min: 0, max: 0, promedio: 0 }
        });
      }
      setCargando(false);
      setReporteGenerado(true);
    });
  };

  // Cargar datos iniciales (últimos 7 días)
  useEffect(() => {
    const fin = new Date();
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - 7);
    
    setFechaInicio(inicio);
    setFechaFin(fin);
  }, []);

  // Componente personalizado para el tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded shadow-lg max-w-xs">
          <p className="font-bold break-words">{label}</p>
          <p className="text-blue-600">{`${payload[0].name}: ${payload[0].value}`}</p>
          <p className="text-gray-500 text-sm break-words">Ubicación: {payload[0].payload.ubicacion}</p>
        </div>
      );
    }
    return null;
  };

  const generarReporte = () => {
    obtenerDatos();
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
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">Reportes Manzano - pH y Cloro</h1>
            <button 
              className="md:hidden text-gray-500 text-xl"
              onClick={() => setMenuAbierto(true)}
            >
              ☰
            </button>
          </div>
          
          {/* Selectores de fecha y botón */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de inicio</label>
              <DatePicker
                selected={fechaInicio}
                onChange={(date) => setFechaInicio(date)}
                selectsStart
                startDate={fechaInicio}
                endDate={fechaFin}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de fin</label>
              <DatePicker
                selected={fechaFin}
                onChange={(date) => setFechaFin(date)}
                selectsEnd
                startDate={fechaInicio}
                endDate={fechaFin}
                minDate={fechaInicio}
                className="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={generarReporte}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded transition"
              >
                Generar Reporte
              </button>
            </div>
          </div>

          {cargando ? (
            <div className="text-center py-8">
              <p>Cargando datos...</p>
            </div>
          ) : reporteGenerado ? (
            <>
              {/* Gráfico de pH */}
              <div className="mb-8">
                <h2 className="text-lg md:text-xl font-semibold mb-4">Niveles de pH</h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div style={{ height: '400px', width: '100%', minHeight: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={datosPH}
                        margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="fecha" 
                          tickFormatter={(value) => value.split(' ')[0]} 
                          angle={-45} 
                          height={80}
                          tickMargin={30}
                          interval={Math.floor(datosPH.length / 7)}
                        />
                        <YAxis domain={[6, 9]} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="valor" 
                          name="pH" 
                          stroke="#3b82f6" 
                          strokeWidth={2} 
                          dot={{ r: 4 }} 
                          activeDot={{ r: 6 }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Estadísticas de pH */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium text-blue-800">Mínimo</h3>
                    <p className="text-xl md:text-2xl font-bold text-blue-600">{estadisticas.ph.min.toFixed(2)}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium text-blue-800">Máximo</h3>
                    <p className="text-xl md:text-2xl font-bold text-blue-600">{estadisticas.ph.max.toFixed(2)}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium text-blue-800">Promedio</h3>
                    <p className="text-xl md:text-2xl font-bold text-blue-600">{estadisticas.ph.promedio.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Gráfico de Cloro */}
              <div className="mb-8">
                <h2 className="text-lg md:text-xl font-semibold mb-4">Niveles de Cloro (ppm)</h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div style={{ height: '400px', width: '100%', minHeight: '300px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={datosCloro}
                        margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="fecha" 
                          tickFormatter={(value) => value.split(' ')[0]} 
                          angle={-45} 
                          height={80}
                          tickMargin={30}
                          interval={Math.floor(datosCloro.length / 7)}
                        />
                        <YAxis domain={[0, 3]} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="valor" 
                          name="Cloro (ppm)" 
                          stroke="#10b981" 
                          strokeWidth={2} 
                          dot={{ r: 4 }} 
                          activeDot={{ r: 6 }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Estadísticas de Cloro */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-medium text-green-800">Mínimo</h3>
                    <p className="text-xl md:text-2xl font-bold text-green-600">{estadisticas.cloro.min.toFixed(2)}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-medium text-green-800">Máximo</h3>
                    <p className="text-xl md:text-2xl font-bold text-green-600">{estadisticas.cloro.max.toFixed(2)}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-medium text-green-800">Promedio</h3>
                    <p className="text-xl md:text-2xl font-bold text-green-600">{estadisticas.cloro.promedio.toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {datosPH.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No hay datos disponibles para el rango de fechas seleccionado</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>Seleccione un rango de fechas y haga clic en "Generar Reporte"</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ReportesManzano;