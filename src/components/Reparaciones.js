import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getDatabase, ref,  remove, push, update, set, onValue } from 'firebase/database';
import app from '../FirebaseConfiguration';

function RegistroOrden() {
  const [nuevaOrden, setNuevaOrden] = useState('');
  const [ordenesUsuario, setOrdenesUsuario] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const nombreUsuario = localStorage.getItem('nombreUsuario') || 'Operario';
  const db = getDatabase(app);
  const sincronizacionEnProgreso = useRef(false);

  // Función para actualizar el estado local
  const actualizarOrdenes = useCallback((nuevasOrdenes) => {
    setOrdenesUsuario(nuevasOrdenes);
    localStorage.setItem(`ordenes_${nombreUsuario}`, JSON.stringify(nuevasOrdenes));
  }, [nombreUsuario]);

  // Obtener ubicación con manejo de errores
  const obtenerUbicacion = useCallback(() => {
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
          resolve({
            lat: '0.000000',
            lng: '0.000000',
            precision: 0,
            timestamp: new Date().toISOString(),
            error: err.message
          });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }, []);

const verificarConexionFirebase = useCallback(() => {
  return new Promise((resolve) => {
    const conexionRef = ref(db, '.info/connected');

    let unsubscribe;

    const handleSnapshot = (snapshot) => {
      if (snapshot.val() === true) {
        if (unsubscribe) unsubscribe();
        resolve(true);
      }
    };

    unsubscribe = onValue(conexionRef, handleSnapshot, { onlyOnce: true });

    // Timeout por si no hay respuesta
    setTimeout(() => {
      if (unsubscribe) unsubscribe();
      resolve(false);
    }, 2000);
  });
}, [db]);

  // Sincronizar una orden con Firebase
  const sincronizarOrden = useCallback(async (orden) => {
    try {
      const estaConectado = await verificarConexionFirebase();
      if (!estaConectado) {
        return { ...orden, online: false };
      }

      if (orden.id.startsWith('local-')) {
        const { id: oldId, ...ordenSinId } = orden;
        const nuevaRef = await push(ref(db, 'ordenes'), ordenSinId);
        return { ...orden, id: nuevaRef.key, online: true };
      } else {
        await update(ref(db, `ordenes/${orden.id}`), orden);
        return { ...orden, online: true };
      }
    } catch (error) {
      console.error('Error sincronizando orden:', error);
      return { ...orden, online: false };
    }
  }, [db, verificarConexionFirebase]);

  // Sincronizar todas las órdenes pendientes
  const sincronizarPendientes = useCallback(async () => {
  if (sincronizacionEnProgreso.current || !navigator.onLine) return;
  
  sincronizacionEnProgreso.current = true;
  console.log('Iniciando sincronización...');

  try {
    const ordenesPendientes = ordenesUsuario.filter(
      o => !o.online || o.id.startsWith('local-')
    );

    if (ordenesPendientes.length === 0) return;

    const nuevasOrdenes = [...ordenesUsuario];
    let cambios = false;

    for (const orden of ordenesPendientes) {
      // Solo intentar sincronizar si ha pasado al menos 1 minuto desde el último intento
      const ultimoIntento = orden.ultimoIntento || 0;
      if (Date.now() - ultimoIntento < 60000) continue;

      try {
        const ordenActualizada = await sincronizarOrden({
          ...orden,
          ultimoIntento: Date.now()
        });
        
        const index = nuevasOrdenes.findIndex(o => o.id === orden.id);
        if (index !== -1) {
          nuevasOrdenes[index] = ordenActualizada;
          cambios = true;
        }
      } catch (error) {
        console.error('Error sincronizando orden:', orden.id, error);
      }
    }

    if (cambios) {
      await actualizarOrdenes(nuevasOrdenes);
    }
  } catch (error) {
    console.error('Error en sincronización general:', error);
  } finally {
    sincronizacionEnProgreso.current = false;
  }
}, [ordenesUsuario, sincronizarOrden, actualizarOrdenes]);

  // Cargar datos iniciales
 useEffect(() => {
  const cargarOrdenes = async () => {
    if (navigator.onLine) {
      const estaConectado = await verificarConexionFirebase();
      if (estaConectado) {
        const ordenesRef = ref(db, 'ordenes');
        onValue(ordenesRef, (snapshot) => {
          const datos = snapshot.val() || {};
          const ordenes = Object.entries(datos)
            .filter(([, orden]) => orden.nombreUsuario === nombreUsuario)
            .map(([id, orden]) => ({ ...orden, id, online: true }))
            .sort((a, b) => b.timestamp - a.timestamp);

          localStorage.setItem(`ordenes_${nombreUsuario}`, JSON.stringify(ordenes));
          setOrdenesUsuario(ordenes);
        });

        return;
      }
    }

    const ordenesGuardadas = JSON.parse(localStorage.getItem(`ordenes_${nombreUsuario}`)) || [];
    setOrdenesUsuario(ordenesGuardadas);
  };

  cargarOrdenes();
}, [nombreUsuario, db, verificarConexionFirebase]); // 👈 agregar aquí




  // Configurar listeners de conexión
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      await sincronizarPendientes();
    };

    const handleOffline = () => setIsOnline(false);

    // Listener para cambios de conexión
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificar conexión al cargar
    const checkInitialConnection = async () => {
      const estaOnline = navigator.onLine && await verificarConexionFirebase();
      setIsOnline(estaOnline);
      if (estaOnline) {
        await sincronizarPendientes();
      }
    };

    checkInitialConnection();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [sincronizarPendientes, verificarConexionFirebase]);

  // Guardar nueva orden
  const guardarOrden = async () => {
  if (!nuevaOrden.trim()) {
    alert('Por favor ingrese un número de orden válido');
    return;
  }

  // Verificar si la orden ya existe (incluyendo las locales)
  const ordenExistente = ordenesUsuario.find(o => o.numeroOrden === nuevaOrden);
  if (ordenExistente) {
    alert(`⚠️ La orden ${nuevaOrden} ya está registrada`);
    return;
  }

  // Crear ID único local (que también se usará en Firebase)
  const localId = `orden-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const nuevaOrdenObj = {
    id: localId,
    numeroOrden: nuevaOrden,
    nombreUsuario,
    fecha: new Date().toLocaleDateString(),
    estado: 'pendiente',
    horaLlegada: null,
    ubicacionLlegada: null,
    horaFinalizacion: null,
    ubicacionFinal: null,
    online: false,
    timestamp: Date.now()
  };

  try {
    // Guardar localmente primero
    const nuevasOrdenes = [nuevaOrdenObj, ...ordenesUsuario];
    actualizarOrdenes(nuevasOrdenes);
    setNuevaOrden('');

    // Intentar sincronizar si hay conexión
    if (navigator.onLine) {
      const estaConectado = await verificarConexionFirebase();
      if (estaConectado) {
        // Guardar en Firebase usando el mismo ID
        const ordenRef = ref(db, `ordenes/${localId}`);
        await set(ordenRef, { ...nuevaOrdenObj, online: true });

        // Actualizar local para reflejar que está online
        const ordenesActualizadas = nuevasOrdenes.map(o =>
          o.id === localId ? { ...o, online: true } : o
        );
        actualizarOrdenes(ordenesActualizadas);

        alert(`✅ Orden ${nuevaOrden} registrada en línea`);
        return;
      }
    }

    // Si no hay conexión
    alert(`✅ Orden ${nuevaOrden} guardada localmente (sin conexión)`);
  } catch (error) {
    console.error('Error al guardar la orden:', error);
    alert('❌ Error al guardar la orden');
  }
};


  // Registrar acción (llegada/finalización)
  const registrarAccion = async (ordenId, accion) => {
    try {
      const ubicacion = await obtenerUbicacion();
      
      // Actualizar orden localmente primero
      const ordenActualizada = {
        ...ordenesUsuario.find(o => o.id === ordenId),
        estado: accion === 'llegada' ? 'en_progreso' : 'completado',
        [`hora${accion === 'llegada' ? 'Llegada' : 'Finalizacion'}`]: new Date().toLocaleTimeString(),
        [`ubicacion${accion === 'llegada' ? 'Llegada' : 'Final'}`]: ubicacion,
        online: isOnline,
        ultimoIntento: Date.now()
      };

      const nuevasOrdenes = ordenesUsuario.map(o => 
        o.id === ordenId ? ordenActualizada : o
      );
      actualizarOrdenes(nuevasOrdenes);

      // Intentar sincronizar si hay conexión
      if (isOnline) {
        try {
          const estaConectado = await verificarConexionFirebase();
          if (estaConectado) {
            await update(ref(db, `ordenes/${ordenId}`), ordenActualizada);
            // Actualizar estado a online si se sincronizó correctamente
            const ordenesActualizadas = nuevasOrdenes.map(o => 
              o.id === ordenId ? { ...o, online: true } : o
            );
            actualizarOrdenes(ordenesActualizadas);
          } else {
            setIsOnline(false);
          }
        } catch (error) {
          console.error('Error sincronizando acción:', error);
        }
      }

      alert(`✅ ${accion === 'llegada' ? 'Llegada' : 'Finalización'} ${ordenActualizada.online ? 'registrada' : 'guardada localmente'}`);
    } catch (error) {
      alert(`❌ Error al registrar ${accion}: ${error.message}`);
    }
  };

 

const eliminarTodosLosRegistros = async () => {
  const confirmacion = window.confirm("¿Estás seguro de que deseas eliminar todos los registros?");
  if (!confirmacion) return;

  try {
    // ✅ Eliminar de Firebase correctamente usando `remove()`
    await remove(ref(db, 'ordenes'));

    // ✅ Eliminar del localStorage
    localStorage.removeItem('pendientes');

    alert('✅ Todos los registros han sido eliminados');
  } catch (error) {
    console.error('Error eliminando registros:', error);
    alert('❌ Error eliminando registros');
  }
};



  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <div className={`mb-4 p-2 rounded-md ${
          isOnline ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          Estado: {isOnline ? 'Conectado' : 'Sin conexión - Modo offline'}
        </div>

        <h2 className="text-xl font-bold text-center mb-6">Registro de Órdenes</h2>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Orden</label>
          <div className="flex">
            <input
              type="text"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md"
              value={nuevaOrden}
              onChange={(e) => setNuevaOrden(e.target.value)}
              placeholder="Número de orden"
            />
            <button
              onClick={guardarOrden}
              className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700 disabled:bg-gray-400"
              disabled={!nuevaOrden.trim()}
            >
              Crear
            </button>
            <button
  onClick={eliminarTodosLosRegistros}
  className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 mt-4"
>
  Eliminar Todos los Registros
</button>

          </div>
        </div>

        <h3 className="font-medium mb-2">Mis Órdenes</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Orden</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Estado</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ordenesUsuario.length > 0 ? (
                [...ordenesUsuario]
                  .sort((a, b) => b.timestamp - a.timestamp)
                  .map((orden) => (
                    <tr key={orden.id} className={orden.id.startsWith('local-') ? 'bg-gray-50' : ''}>
                      <td className="px-4 py-2 text-sm">
                        {orden.numeroOrden}
                        {orden.id.startsWith('local-') && (
                          <span className="ml-1 text-xs text-gray-500">(local)</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          orden.estado === 'completado' ? 'bg-green-100 text-green-800' :
                          orden.estado === 'en_progreso' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {orden.estado === 'completado' ? 'Completada' :
                           orden.estado === 'en_progreso' ? 'En progreso' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="px-4 py-2 space-x-1">
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