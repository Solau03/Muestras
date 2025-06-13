import React, { useState, useEffect } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import app from '../FirebaseConfiguration';

function AdminOrdenes() {
  const [ordenes, setOrdenes] = useState([]);
  const db = getDatabase(app);

  useEffect(() => {
    const ordenesRef = ref(db, 'ordenes');
    const unsubscribe = onValue(ordenesRef, (snapshot) => {
      const data = snapshot.val();
      const listaOrdenes = data ? Object.values(data) : [];
      setOrdenes(listaOrdenes);
    });

    return () => unsubscribe();
  }, [db]);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-100 to-green-100">
  {/* Sidebar */}
  <aside className="w-64 bg-white shadow-lg p-6 flex-shrink-0">
    <h2 className="text-2xl font-bold text-blue-700 mb-8">Admin</h2>
    <nav className="space-y-4">
      <a href="/Muestras" className="block text-gray-700 hover:text-blue-600">Muestras Calidad</a>
      <a href="/Muestrasreportes" className="block text-gray-700 hover:text-blue-600">Reportes Calidad</a>
      <a href="/AdmiOrden" className="block text-gray-700 hover:text-blue-600">Órdenes Reparación</a>
      <a href="/Macros" className="block text-gray-700 hover:text-red-500">Lecturas Macro</a>
      <a href="/ReporteMacros" className="block text-gray-700 hover:text-red-500">Reportes Macro</a>
    </nav>
  </aside>

  {/* Contenido principal */}
  <main className="flex-1 p-6 sm:p-10 overflow-auto">
    <div className="bg-white rounded-xl shadow-lg p-6 sm:p-10">
      <h1 className="text-3xl font-bold text-center text-green-600 mb-8">
        Reporte de Órdenes
      </h1>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm sm:text-base">
          <thead className="bg-green-100">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-green-800">Orden</th>
              <th className="px-4 py-3 text-left font-semibold text-green-800">Operario</th>
              <th className="px-4 py-3 text-left font-semibold text-green-800">Fecha</th>
              <th className="px-4 py-3 text-left font-semibold text-green-800">Llegada</th>
              <th className="px-4 py-3 text-left font-semibold text-green-800">Finalización</th>
              <th className="px-4 py-3 text-left font-semibold text-green-800">Estado</th>
              <th className="px-4 py-3 text-left font-semibold text-green-800">Ubicación Llegada</th>
              <th className="px-4 py-3 text-left font-semibold text-green-800">Ubicación Final</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {ordenes.length > 0 ? (
              ordenes.map((orden, index) => (
                <tr key={index} className="hover:bg-blue-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{orden.numeroOrden}</td>
                  <td className="px-4 py-3 text-gray-700">{orden.nombreUsuario}</td>
                  <td className="px-4 py-3 text-gray-700">{orden.fecha}</td>
                  <td className="px-4 py-3 text-gray-600">{orden.horaLlegada || '--'}</td>
                  <td className="px-4 py-3 text-gray-600">{orden.horaFinalizacion || '--'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      orden.estado === 'completado' ? 'bg-green-200 text-green-800' :
                      orden.estado === 'en_progreso' ? 'bg-yellow-200 text-yellow-800' :
                      'bg-gray-200 text-gray-800'
                    }`}>
                      {orden.estado === 'completado' ? 'Completada' :
                       orden.estado === 'en_progreso' ? 'En progreso' : 'Pendiente'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {orden.ubicacionLlegada ? `${orden.ubicacionLlegada.lat}, ${orden.ubicacionLlegada.lng}` : '--'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {orden.ubicacionFinal ? `${orden.ubicacionFinal.lat}, ${orden.ubicacionFinal.lng}` : '--'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="px-4 py-6 text-center text-gray-500">
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
