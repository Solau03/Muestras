import React, { useState, useEffect } from 'react';
import { getDatabase, ref, query, orderByChild, startAt, endAt, onValue } from 'firebase/database';
import app from '../FirebaseConfiguration';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const ReportesManzano = () => {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [registrosFiltrados, setRegistrosFiltrados] = useState([]);
  const [cargando, setCargando] = useState(false);

  // Obtener la fecha actual en formato YYYY-MM-DD para el input date
  useEffect(() => {
    const hoy = new Date();
    const fechaHoy = hoy.toISOString().split('T')[0];
    setFechaInicio(fechaHoy);
    setFechaFin(fechaHoy);
  }, []);

  // Cargar registros filtrados por rango de fechas
  useEffect(() => {
    if (!fechaInicio || !fechaFin) return;

    const cargarRegistros = async () => {
      setCargando(true);
      const db = getDatabase(app);
      
      // Convertir las fechas seleccionadas a timestamp
      const inicioDia = new Date(fechaInicio);
      inicioDia.setHours(0, 0, 0, 0);
      
      const finDia = new Date(fechaFin);
      finDia.setHours(23, 59, 59, 999);
      
      const q = query(
        ref(db, 'registrosPHCloro'),
        orderByChild('timestamp'),
        startAt(inicioDia.getTime()),
        endAt(finDia.getTime())
      );
      
      onValue(q, (snapshot) => {
        const data = snapshot.val();
        const registrosArray = data ? Object.values(data) : [];
        // Ordenar por timestamp
        registrosArray.sort((a, b) => a.timestamp - b.timestamp);
        setRegistrosFiltrados(registrosArray);
        setCargando(false);
      });
    };

    cargarRegistros();
  }, [fechaInicio, fechaFin]);

  // Calcular estadísticas para los datos
  const calcularEstadisticas = (datos) => {
    if (datos.length === 0) return { min: 0, max: 0, promedio: 0 };
    
    const min = Math.min(...datos);
    const max = Math.max(...datos);
    const promedio = datos.reduce((a, b) => a + b, 0) / datos.length;
    
    return { min, max, promedio: parseFloat(promedio.toFixed(2)) };
  };

  // Preparar datos para las gráficas
  const prepararDatosGraficas = () => {
    const etiquetas = registrosFiltrados.map(reg => {
      const fecha = new Date(reg.timestamp);
      return fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });
    
    const datosPH = registrosFiltrados.map(reg => reg.ph);
    const datosCloro = registrosFiltrados.map(reg => reg.cloro);

    const statsPH = calcularEstadisticas(datosPH);
    const statsCloro = calcularEstadisticas(datosCloro);

    return {
      etiquetas,
      datosPH,
      datosCloro,
      statsPH,
      statsCloro
    };
  };

  const { etiquetas, datosPH, datosCloro, statsPH, statsCloro } = prepararDatosGraficas();

  // Configuración de la gráfica de pH
  const dataPH = {
    labels: etiquetas,
    datasets: [
      {
        label: 'Valores de pH',
        data: datosPH,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
        fill: true,
        pointBackgroundColor: 'rgba(75, 192, 192, 1)',
        pointRadius: 4,
        pointHoverRadius: 6
      },
      {
        label: 'Mínimo',
        data: Array(etiquetas.length).fill(statsPH.min),
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
        borderDash: [5, 5],
        pointRadius: 0
      },
      {
        label: 'Máximo',
        data: Array(etiquetas.length).fill(statsPH.max),
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
        borderDash: [5, 5],
        pointRadius: 0
      },
      {
        label: 'Promedio',
        data: Array(etiquetas.length).fill(statsPH.promedio),
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
        borderDash: [5, 5],
        pointRadius: 0
      }
    ]
  };

  // Configuración de la gráfica de Cloro
  const dataCloro = {
    labels: etiquetas,
    datasets: [
      {
        label: 'Valores de Cloro (ppm)',
        data: datosCloro,
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.1,
        fill: true,
        pointBackgroundColor: 'rgba(54, 162, 235, 1)',
        pointRadius: 4,
        pointHoverRadius: 6
      },
      {
        label: 'Mínimo',
        data: Array(etiquetas.length).fill(statsCloro.min),
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
        borderDash: [5, 5],
        pointRadius: 0
      },
      {
        label: 'Máximo',
        data: Array(etiquetas.length).fill(statsCloro.max),
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
        borderDash: [5, 5],
        pointRadius: 0
      },
      {
        label: 'Promedio',
        data: Array(etiquetas.length).fill(statsCloro.promedio),
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
        borderDash: [5, 5],
        pointRadius: 0
      }
    ]
  };

  const opcionesComunes = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.raw}`;
          }
        }
      }
    }
  };

  // Opciones específicas para pH
  const opcionesPH = {
    ...opcionesComunes,
    scales: {
      y: {
        min: 6,
        max: 9,
        ticks: {
          stepSize: 0.5
        }
      }
    }
  };

  // Opciones específicas para Cloro
  const opcionesCloro = {
    ...opcionesComunes,
    scales: {
      y: {
        min: 0,
        max: 3,
        ticks: {
          stepSize: 0.2
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="bg-white rounded-lg shadow overflow-hidden p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Reporte Manzano - pH y Cloro</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="fecha-inicio" className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de inicio
            </label>
            <input
              type="date"
              id="fecha-inicio"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="p-2 border border-gray-300 rounded-md w-full"
            />
          </div>
          
          <div>
            <label htmlFor="fecha-fin" className="block text-sm font-medium text-gray-700 mb-2">
              Fecha de fin
            </label>
            <input
              type="date"
              id="fecha-fin"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="p-2 border border-gray-300 rounded-md w-full"
            />
          </div>
        </div>

        {cargando ? (
          <div className="text-center py-8">
            <p>Cargando datos...</p>
          </div>
        ) : registrosFiltrados.length === 0 ? (
          <div className="text-center py-8">
            <p>No hay registros para el rango de fechas seleccionado</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Variación de pH</h2>
                <div className="h-64">
                  <Line data={dataPH} options={opcionesPH} />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="bg-red-50 p-2 rounded">
                    <p className="text-xs text-gray-500">Mínimo</p>
                    <p className="font-bold">{statsPH.min}</p>
                  </div>
                  <div className="bg-purple-50 p-2 rounded">
                    <p className="text-xs text-gray-500">Promedio</p>
                    <p className="font-bold">{statsPH.promedio}</p>
                  </div>
                  <div className="bg-blue-50 p-2 rounded">
                    <p className="text-xs text-gray-500">Máximo</p>
                    <p className="font-bold">{statsPH.max}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Rango óptimo:</span> 6.5 - 9
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Variación de Cloro (ppm)</h2>
                <div className="h-64">
                  <Line data={dataCloro} options={opcionesCloro} />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="bg-red-50 p-2 rounded">
                    <p className="text-xs text-gray-500">Mínimo</p>
                    <p className="font-bold">{statsCloro.min}</p>
                  </div>
                  <div className="bg-purple-50 p-2 rounded">
                    <p className="text-xs text-gray-500">Promedio</p>
                    <p className="font-bold">{statsCloro.promedio}</p>
                  </div>
                  <div className="bg-blue-50 p-2 rounded">
                    <p className="text-xs text-gray-500">Máximo</p>
                    <p className="font-bold">{statsCloro.max}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Rango óptimo:</span> 0.3 - 2.0 ppm
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ReportesManzano;