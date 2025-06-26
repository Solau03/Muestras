import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue, remove } from 'firebase/database';
import app from '../FirebaseConfiguration';

function AdminOrdenes() {
  const [ordenes, setOrdenes] = useState([]);
  const db = getDatabase(app);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
  const [ordenesPorPagina] = useState(10);

  useEffect(() => {
    const ordenesRef = ref(db, 'ordenes');
    
    const unsubscribe = onValue(ordenesRef, (snapshot) => {
      const data = snapshot.val();
      let listaOrdenes = data ? Object.keys(data).map(key => ({
        id: key,
        ...data[key],
        // Crear timestamp combinando fecha y hora para ordenar
        timestamp: data[key].horaLlegada 
          ? new Date(`${data[key].fecha} ${data[key].horaLlegada}`).getTime()
          : new Date(data[key].fecha).getTime()
      })) : [];
      
      // Ordenar por timestamp (más recientes primero)
      listaOrdenes.sort((a, b) => b.timestamp - a.timestamp);
      
      setOrdenes(listaOrdenes.reverse());
      
    });

    return () => unsubscribe();
  }, [db]);

  const eliminarOrden = (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta orden?')) {
      const ordenRef = ref(db, `ordenes/${id}`);
      remove(ordenRef).catch(error => console.error('Error al eliminar orden:', error));
    }
  };

  // Lógica de paginación
  const indiceUltimaOrden = paginaActual * ordenesPorPagina;
  const indicePrimeraOrden = indiceUltimaOrden - ordenesPorPagina;
  const ordenesActuales = ordenes.slice(indicePrimeraOrden, indiceUltimaOrden);
  const totalPaginas = Math.ceil(ordenes.length / ordenesPorPagina);

  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Overlay para móviles cuando el menú está abierto */}
      {menuAbierto && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setMenuAbierto(false)}
        ></div>
      )}

      {/* Sidebar */}
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

          <div className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-2">
            <div className="text-sm text-gray-600">
              Mostrando {indicePrimeraOrden + 1}-{Math.min(indiceUltimaOrden, ordenes.length)} de {ordenes.length} órdenes
            </div>
            {totalPaginas > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Página:</span>
                <select 
                  value={paginaActual}
                  onChange={(e) => cambiarPagina(Number(e.target.value))}
                  className="border rounded-md px-2 py-1 text-sm"
                >
                  {[...Array(totalPaginas)].map((_, i) => (
                    <option key={i} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
                <span className="text-sm text-gray-600">de {totalPaginas}</span>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-green-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-green-700">Orden</th>
                  <th className="px-4 py-3 text-left font-medium text-green-700">Operario</th>
                  <th className="px-4 py-3 text-left font-medium text-green-700">Fecha</th>
                  <th className="px-4 py-3 text-left font-medium text-green-700">Estado</th>
                  <th className="px-4 py-3 text-left font-medium text-green-700">Horario</th>
                  <th className="px-4 py-3 text-left font-medium text-green-700">Ubicaciones</th>
                  <th className="px-4 py-3 text-left font-medium text-green-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ordenesActuales.length > 0 ? (
                  ordenesActuales.map((orden) => (
                    <tr key={orden.id} className="hover:bg-blue-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        <div className="font-semibold">{orden.numeroOrden}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {orden.nombreUsuario}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {orden.fecha}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          orden.estado === 'completado' ? 'bg-green-100 text-green-800' :
                          orden.estado === 'en_progreso' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {orden.estado === 'completado' ? 'Completada' :
                          orden.estado === 'en_progreso' ? 'En progreso' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500">Llegada: {orden.horaLlegada || '--'}</span>
                          <span className="text-xs text-gray-500">Final: {orden.horaFinalizacion || '--'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <div className="flex flex-col space-y-1">
                          {orden.ubicacionLlegada ? (
                            <button 
                              onClick={() => window.open(`https://www.google.com/maps?q=${orden.ubicacionLlegada.lat},${orden.ubicacionLlegada.lng}`, '_blank')}
                              className="px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md text-xs transition-colors"
                            >
                              Mapa llegada
                            </button>
                          ) : <span className="text-xs text-gray-400">Sin ubicación</span>}
                          {orden.ubicacionFinal ? (
                            <button 
                              onClick={() => window.open(`https://www.google.com/maps?q=${orden.ubicacionFinal.lat},${orden.ubicacionFinal.lng}`, '_blank')}
                              className="px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md text-xs transition-colors"
                            >
                              Mapa final
                            </button>
                          ) : <span className="text-xs text-gray-400">Sin ubicación</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button 
                          onClick={() => eliminarOrden(orden.id)}
                          className="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded-md text-sm transition-colors"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-4 py-6 text-center text-gray-500">
                      No hay órdenes registradas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación para móviles */}
          {totalPaginas > 1 && (
            <div className="mt-6 flex justify-center">
              <div className="flex gap-2">
                <button
                  onClick={() => cambiarPagina(paginaActual - 1)}
                  disabled={paginaActual === 1}
                  className={`px-4 py-2 rounded-md ${paginaActual === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  Anterior
                </button>
                <button
                  onClick={() => cambiarPagina(paginaActual + 1)}
                  disabled={paginaActual === totalPaginas}
                  className={`px-4 py-2 rounded-md ${paginaActual === totalPaginas ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminOrdenes;