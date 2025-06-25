import React, { useState, useEffect } from "react";
import app from "../FirebaseConfiguration";
import { getDatabase, ref, onValue } from "firebase/database";
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { format, parseISO, subDays } from 'date-fns';
import { es } from 'date-fns/locale';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function ReportesNivelTanque() {
  const [registros, setRegistros] = useState([]);
  const [fechaInicio, setFechaInicio] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [fechaFin, setFechaFin] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const db = getDatabase(app);

  // Cargar registros de Firebase
  useEffect(() => {
    setCargando(true);
    const registrosRef = ref(db, "nivelTanque/registros");
    
    const unsubscribe = onValue(registrosRef, (snapshot) => {
      try {
        const data = snapshot.val();
        if (data) {
          const listaConIds = Object.entries(data).map(([id, registro]) => ({
            id,
            ...registro,
            // Asegurar que la fecha esté en formato ISO si no lo está
            fecha: registro.fecha.includes('/') ? 
              convertirFechaLocalAISO(registro.fecha) : 
              registro.fecha
          }));
          setRegistros(listaConIds);
        } else {
          setRegistros([]);
        }
        setError(null);
      } catch (err) {
        setError("Error al cargar los datos");
        console.error("Error:", err);
      } finally {
        setCargando(false);
      }
    }, (error) => {
      setError("Error de conexión con Firebase");
      setCargando(false);
    });

    return () => unsubscribe();
  }, [db]);

  // Función para convertir fechas locales a formato ISO
  const convertirFechaLocalAISO = (fechaLocal) => {
    const [day, month, year] = fechaLocal.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  // Preparar datos para la gráfica
  const prepararDatosGrafica = () => {
    try {
      const registrosFiltrados = registros.filter(registro => {
        const fechaRegistro = parseISO(registro.fecha);
        const inicio = parseISO(fechaInicio);
        const fin = parseISO(fechaFin);
        return fechaRegistro >= inicio && fechaRegistro <= fin;
      });

      // Ordenar por fecha
      registrosFiltrados.sort((a, b) => parseISO(a.fecha) - parseISO(b.fecha));

      const labels = registrosFiltrados.map(registro => 
        format(parseISO(registro.fecha), 'dd/MM/yyyy', { locale: es })
      );

      const datos = registrosFiltrados.map(registro => registro.nivel);

      // Calcular estadísticas
      const niveles = registrosFiltrados.map(r => parseFloat(r.nivel));
      const min = niveles.length > 0 ? Math.min(...niveles).toFixed(2) : 'N/A';
      const max = niveles.length > 0 ? Math.max(...niveles).toFixed(2) : 'N/A';
      const promedio = niveles.length > 0 ? 
        (niveles.reduce((a, b) => a + b, 0) / niveles.length).toFixed(2) : 'N/A';

      return {
        labels,
        datasets: [{
          label: 'Nivel del Tanque (m)',
          data: datos,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          tension: 0.1,
          pointRadius: 5,
          pointHoverRadius: 7
        }],
        estadisticas: { min, max, promedio }
      };
    } catch (err) {
      console.error("Error al preparar datos:", err);
      return {
        labels: [],
        datasets: [],
        estadisticas: { min: 'N/A', max: 'N/A', promedio: 'N/A' }
      };
    }
  };

  const { labels, datasets, estadisticas } = prepararDatosGrafica();

  // Opciones de la gráfica
  const opciones = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Histórico de Niveles del Tanque',
        font: {
          size: 16
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const registro = registros
              .filter(r => format(parseISO(r.fecha), 'dd/MM/yyyy', { locale: es }) === context.label)
              .find(r => r.nivel === context.raw);
            
            return [
              `Nivel: ${context.raw} m`,
              `Usuario: ${registro?.usuario || 'Desconocido'}`,
              `Hora: ${registro?.hora || ''}`
            ];
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: 'Nivel (metros)'
        }
      }
    }
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
        <div className="max-w-6xl mx-auto bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Gráficas de Nivel de Tanque</h2>
            
            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
                <p>{error}</p>
              </div>
            )}

            {cargando ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                {/* Selectores de fecha */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio:</label>
                    <input
                      type="date"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                      className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                      max={fechaFin}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin:</label>
                    <input
                      type="date"
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                      className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                      min={fechaInicio}
                      max={format(new Date(), 'yyyy-MM-dd')}
                    />
                  </div>
                </div>

                {/* Gráfica */}
                <div className="h-96 mb-8">
                  {labels.length > 0 ? (
                    <Line options={opciones} data={{ labels, datasets }} />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      No hay datos disponibles para el rango de fechas seleccionado
                    </div>
                  )}
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-800">Nivel Mínimo</h4>
                    <p className="text-2xl font-bold text-blue-600">{estadisticas.min} m</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-green-800">Nivel Promedio</h4>
                    <p className="text-2xl font-bold text-green-600">{estadisticas.promedio} m</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-red-800">Nivel Máximo</h4>
                    <p className="text-2xl font-bold text-red-600">{estadisticas.max} m</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default ReportesNivelTanque;