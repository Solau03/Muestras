import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue, remove } from 'firebase/database';
import app from '../FirebaseConfiguration';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function AdminOrdenes() {
  const [ordenes, setOrdenes] = useState([]);
  const [ultimaOrden, setUltimaOrden] = useState(null);
  const db = getDatabase(app);
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    const ordenesRef = ref(db, 'ordenes');
    
    const unsubscribe = onValue(ordenesRef, (snapshot) => {
      const data = snapshot.val();
      const listaOrdenes = data ? Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      })) : [];
      
      // Detectar nueva orden
      if (listaOrdenes.length > ordenes.length) {
        const nuevaOrden = listaOrdenes[listaOrdenes.length - 1];
        setUltimaOrden(nuevaOrden);
      }
      
      setOrdenes(listaOrdenes);
    });

    return () => unsubscribe();
  }, [db, ordenes.length]);

  // Mostrar notificación cuando hay una nueva orden
  useEffect(() => {
    if (ultimaOrden) {
      toast.info(`Nueva orden creada: ${ultimaOrden.numeroOrden}`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  }, [ultimaOrden]);

  const eliminarOrden = (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta orden?')) {
      const ordenRef = ref(db, `ordenes/${id}`);
      remove(ordenRef)
        .then(() => {
          toast.success('Orden eliminada correctamente');
          console.log('Orden eliminada');
        })
        .catch(error => {
          toast.error('Error al eliminar orden');
          console.error('Error al eliminar orden:', error);
        });
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <ToastContainer />
      
      {/* Overlay para móviles cuando el menú está abierto */}
      {menuAbierto && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setMenuAbierto(false)}
        ></div>
      )}

      {/* Sidebar mejorado */}
      <aside className={`fixed md:relative z-30 md:z-0 w-64 bg-white shadow-md p-4 transform transition-transform duration-300 ease-in-out h-screen ${
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
      <main className="flex-1 p-4 sm:p-6 overflow-auto">
        <div className="mb-4 flex justify-between items-center md:hidden">
          <button 
            onClick={() => setMenuAbierto(!menuAbierto)}
            className="p-2 rounded-md bg-blue-100 text-blue-600"
          >
            ☰ Menú
          </button>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-center text-green-600 mb-6">
            Reporte de Órdenes
          </h1>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm md:text-base">
              <thead className="bg-green-50">
                <tr>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-left font-medium text-green-700 whitespace-nowrap">Orden</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-left font-medium text-green-700 whitespace-nowrap">Operario</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-left font-medium text-green-700 whitespace-nowrap">Fecha</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-left font-medium text-green-700 whitespace-nowrap">Llegada</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-left font-medium text-green-700 whitespace-nowrap">Finalización</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-left font-medium text-green-700 whitespace-nowrap">Estado</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-left font-medium text-green-700 whitespace-nowrap">Ubicación Llegada</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-left font-medium text-green-700 whitespace-nowrap">Ubicación Final</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3 text-left font-medium text-green-700 whitespace-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {ordenes.length > 0 ? (
                  ordenes.map((orden) => (
                    <tr key={orden.id} className="hover:bg-blue-50 transition-colors">
                      <td className="px-3 py-2 sm:px-4 sm:py-3 font-medium text-gray-900 whitespace-nowrap">{orden.numeroOrden}</td>
                      <td className="px-3 py-2 sm:px-4 sm:py-3 text-gray-700 whitespace-nowrap">{orden.nombreUsuario}</td>
                      <td className="px-3 py-2 sm:px-4 sm:py-3 text-gray-700 whitespace-nowrap">{orden.fecha}</td>
                      <td className="px-3 py-2 sm:px-4 sm:py-3 text-gray-600 whitespace-nowrap">{orden.horaLlegada || '--'}</td>
                      <td className="px-3 py-2 sm:px-4 sm:py-3 text-gray-600 whitespace-nowrap">{orden.horaFinalizacion || '--'}</td>
                      <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          orden.estado === 'completado' ? 'bg-green-100 text-green-800' :
                          orden.estado === 'en_progreso' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {orden.estado === 'completado' ? 'Completada' :
                          orden.estado === 'en_progreso' ? 'En progreso' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="px-3 py-2 sm:px-4 sm:py-3 text-gray-600 hover:text-blue-600 cursor-pointer whitespace-nowrap" 
                          onClick={() => window.open(`https://www.google.com/maps?q=${orden.ubicacionLlegada?.lat},${orden.ubicacionLlegada?.lng}`, '_blank')}>
                        {orden.ubicacionLlegada ? 'Ver mapa' : '--'}
                      </td>
                      <td className="px-3 py-2 sm:px-4 sm:py-3 text-gray-600 hover:text-blue-600 cursor-pointer whitespace-nowrap" 
                          onClick={() => window.open(`https://www.google.com/maps?q=${orden.ubicacionFinal?.lat},${orden.ubicacionFinal?.lng}`, '_blank')}>
                        {orden.ubicacionFinal ? 'Ver mapa' : '--'}
                      </td>
                      <td className="px-3 py-2 sm:px-4 sm:py-3 whitespace-nowrap">
                        <button 
                          onClick={() => eliminarOrden(orden.id)}
                          className="text-red-500 hover:text-red-700 hover:underline transition-colors text-xs sm:text-sm"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="px-4 py-6 text-center text-gray-500">
                      No hay órdenes registradas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminOrdenes;