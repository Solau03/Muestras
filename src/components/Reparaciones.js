import React, { useState, useEffect } from 'react';
import { getDatabase, ref, remove, push, update,get,  set, onValue } from 'firebase/database';
import app from '../FirebaseConfiguration';
import { useNavigate } from "react-router-dom";

function RegistroOrden() {
  const [nuevaOrden, setNuevaOrden] = useState('');
  const [ordenesUsuario, setOrdenesUsuario] = useState([]);
  const nombreUsuario = localStorage.getItem('nombreUsuario') || 'Operario';
  const navigate = useNavigate();
  const db = getDatabase(app);

  // Cargar datos iniciales
  useEffect(() => {
    const ordenesRef = ref(db, 'ordenes');
    const unsubscribe = onValue(ordenesRef, (snapshot) => {
      const datos = snapshot.val() || {};
      const ordenes = Object.entries(datos)
        .filter(([, orden]) => orden.nombreUsuario === nombreUsuario)
        .map(([id, orden]) => ({ ...orden, id }))
        .sort((a, b) => b.timestamp - a.timestamp);

      setOrdenesUsuario(ordenes);
    });

    return () => unsubscribe();
  }, [nombreUsuario, db]);

  // Obtener ubicación con manejo de errores
  const obtenerUbicacion = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject(new Error('Geolocalización no soportada'));
      }

      navigator.geolocation.getCurrentPosition(
        position => resolve({
          lat: position.coords.latitude.toFixed(6),
          lng: position.coords.longitude.toFixed(6),
          precision: Math.round(position.coords.accuracy),
          timestamp: new Date().toISOString()
        }),
        err => {
          console.error('Error obteniendo ubicación:', err);
          reject(err);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  // Guardar nueva orden (fixed to prevent duplicates)
  const guardarOrden = async () => {
    if (!nuevaOrden.trim()) {
      alert('Por favor ingrese un número de orden válido');
      return;
    }

    try {
      // Check for existing order in Firebase to prevent duplicates
      const ordenesSnapshot = await get(ref(db, 'ordenes'));
      const ordenesData = ordenesSnapshot.val() || {};
      
      const ordenExistente = Object.values(ordenesData).find(
        o => o.numeroOrden === nuevaOrden && o.nombreUsuario === nombreUsuario
      );

      if (ordenExistente) {
        alert(`⚠️ La orden ${nuevaOrden} ya está registrada`);
        return;
      }

      const nuevaOrdenObj = {
        numeroOrden: nuevaOrden,
        nombreUsuario,
        fecha: new Date().toLocaleDateString(),
        estado: 'pendiente',
        horaLlegada: null,
        ubicacionLlegada: null,
        horaFinalizacion: null,
        ubicacionFinal: null,
        timestamp: Date.now()
      };

      // Guardar en Firebase
      const nuevaRef = await push(ref(db, 'ordenes'), nuevaOrdenObj);
      
      // No need to manually update state - the onValue listener will handle it
      setNuevaOrden('');
      alert(`✅ Orden ${nuevaOrden} registrada correctamente`);
    } catch (error) {
      console.error('Error al guardar la orden:', error);
      alert('❌ Error al guardar la orden');
    }
  };

  // Registrar acción (llegada/finalización)
  const registrarAccion = async (ordenId, accion) => {
    try {
      const ubicacion = await obtenerUbicacion();
      
      const updates = {
        estado: accion === 'llegada' ? 'en_progreso' : 'completado',
        [`hora${accion === 'llegada' ? 'Llegada' : 'Finalizacion'}`]: new Date().toLocaleTimeString(),
        [`ubicacion${accion === 'llegada' ? 'Llegada' : 'Final'}`]: ubicacion
      };

      // Actualizar en Firebase
      await update(ref(db, `ordenes/${ordenId}`), updates);
      
      // No need to manually update state - the onValue listener will handle it
      alert(`✅ ${accion === 'llegada' ? 'Llegada' : 'Finalización'} registrada`);
    } catch (error) {
      alert(`❌ Error al registrar ${accion}: ${error.message}`);
    }
  };

  const eliminarTodosLosRegistros = async () => {
    const confirmacion = window.confirm("¿Estás seguro de que deseas eliminar todos los registros?");
    if (!confirmacion) return;

    try {
      await remove(ref(db, 'ordenes'));
      alert('✅ Todos los registros han sido eliminados');
    } catch (error) {
      console.error('Error eliminando registros:', error);
      alert('❌ Error eliminando registros');
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem("nombreUsuario");
    localStorage.removeItem("tipoUsuario");
    navigate("/log");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Responsive Header */}
      <header className="bg-blue-400 text-white p-3 sm:p-4 shadow-md flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
        <div className="text-center sm:text-left">
          <h1 className="text-xl sm:text-2xl font-bold">Bienvenido</h1>
          <p className="text-xs sm:text-sm">👤 {nombreUsuario}</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => navigate("/OperarioDashboard")}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 sm:px-4 sm:py-2 rounded text-sm sm:text-base transition-colors"
          >
            Inicio
          </button>
          <button 
            onClick={cerrarSesion}
            className="bg-red-500 hover:bg-red-600 px-3 py-1 sm:px-4 sm:py-2 rounded text-sm sm:text-base transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-4 sm:p-6 mt-4">
        <h2 className="text-lg sm:text-xl font-bold text-center mb-4 sm:mb-6">Registro de Órdenes</h2>

        {/* Responsive Form */}
        <div className="mb-4 sm:mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Orden</label>
          <div className="flex w-full max-w-xs sm:max-w-none">
  <input
    type="text"
    className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-l-md text-sm sm:text-base"
    value={nuevaOrden}
    onChange={(e) => setNuevaOrden(e.target.value)}
    placeholder="Número de orden"
  />
  <button
    onClick={guardarOrden}
    className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-r-md hover:bg-blue-700 disabled:bg-gray-400 text-sm sm:text-base whitespace-nowrap"
    disabled={!nuevaOrden.trim()}
  >
    Crear
  </button>
</div>
        </div>

        <button
          onClick={eliminarTodosLosRegistros}
          className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 mb-3 sm:mb-4 text-sm sm:text-base"
        >
          Eliminar Todos los Registros
        </button>

        <h3 className="font-medium mb-2 text-sm sm:text-base">Mis Órdenes</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 sm:px-4 sm:py-2 text-left text-xs sm:text-sm font-medium text-gray-500">Orden</th>
                <th className="px-3 py-2 sm:px-4 sm:py-2 text-left text-xs sm:text-sm font-medium text-gray-500">Estado</th>
                <th className="px-3 py-2 sm:px-4 sm:py-2 text-left text-xs sm:text-sm font-medium text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ordenesUsuario.length > 0 ? (
                ordenesUsuario.map((orden) => (
                  <tr key={orden.id}>
                    <td className="px-3 py-2 sm:px-4 sm:py-2 text-sm">
                      {orden.numeroOrden}
                    </td>
                    <td className="px-3 py-2 sm:px-4 sm:py-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        orden.estado === 'completado' ? 'bg-green-100 text-green-800' :
                        orden.estado === 'en_progreso' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {orden.estado === 'completado' ? 'Completada' :
                         orden.estado === 'en_progreso' ? 'En progreso' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-3 py-2 sm:px-4 sm:py-2 space-x-1">
                      {orden.estado === 'pendiente' && (
                        <button
                          onClick={() => registrarAccion(orden.id, 'llegada')}
                          className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                        >
                          Llegada
                        </button>
                      )}
                      {orden.estado === 'en_progreso' && (
                        <button
                          onClick={() => registrarAccion(orden.id, 'finalizacion')}
                          className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                        >
                          Finalizar
                        </button>
                      )}
                      {orden.estado === 'completado' && (
                        <span className="text-xs text-gray-500">Completada</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="px-4 py-4 text-center text-sm text-gray-500">
                    No hay órdenes registradas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default RegistroOrden;