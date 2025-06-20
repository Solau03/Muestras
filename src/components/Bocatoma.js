import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDatabase, ref, push, onValue, off, query, orderByChild, equalTo, update } from 'firebase/database';
import app from '../FirebaseConfiguration';

const RegistroVisitas = () => {
  const [seccionActiva, setSeccionActiva] = useState(null);
  const [ubicacion, setUbicacion] = useState(null);
  const [errorUbicacion, setErrorUbicacion] = useState(null);
  const [registros, setRegistros] = useState({
    bocatoma: [],
    venecia: [],
    samaria: []
  });
  const [rutasActivas, setRutasActivas] = useState({});
  const navigate = useNavigate();
  const usuario = localStorage.getItem('nombreUsuario') || 'Operario';

  // Obtener ubicación en tiempo real
  const obtenerUbicacion = () => {
    if (!navigator.geolocation) {
      setErrorUbicacion('Geolocalización no soportada en este navegador');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUbicacion({
          lat: position.coords.latitude.toFixed(6),
          lng: position.coords.longitude.toFixed(6),
          precision: position.coords.accuracy.toFixed(2)
        });
      },
      (error) => {
        setErrorUbicacion(`Error obteniendo ubicación: ${error.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  };

  // Guardar registro en Firebase
  const guardarRegistro = async (tipo, accion, registroId = null) => {
    const db = getDatabase(app);
    const ahora = new Date();
    
    const registroData = {
      usuario,
      tipo,
      fecha: ahora.toLocaleDateString(),
      horaInicio: accion === 'Iniciado' ? ahora.toLocaleTimeString() : null,
      horaFinal: accion === 'Finalizado' ? ahora.toLocaleTimeString() : null,
      accion,
      ubicacionInicial: accion === 'Iniciado' ? (ubicacion || { lat: 'N/A', lng: 'N/A', precision: 'N/A' }) : null,
      ubicacionFinal: accion === 'Finalizado' ? (ubicacion || { lat: 'N/A', lng: 'N/A', precision: 'N/A' }) : null,
      estado: accion === 'Iniciado' ? 'en_progreso' : 'completado',
      timestamp: Date.now()
    };

    try {
      if (accion === 'Iniciado') {
        const newRef = push(ref(db, `registrosVisitas/${tipo}`));
        await update(newRef, registroData);
        return newRef.key;
      } else if (registroId) {
        await update(ref(db, `registrosVisitas/${tipo}/${registroId}`), {
          horaFinal: ahora.toLocaleTimeString(),
          ubicacionFinal: ubicacion || { lat: 'N/A', lng: 'N/A', precision: 'N/A' },
          estado: 'completado',
          accion: 'Finalizado'
        });
      }
    } catch (error) {
      console.error('Error guardando en Firebase:', error);
    }
    return null;
  };

  // Cargar registros desde Firebase
  useEffect(() => {
    const db = getDatabase(app);
    
    const refs = {
      bocatoma: query(ref(db, 'registrosVisitas/bocatoma'), orderByChild('timestamp')),
      venecia: query(ref(db, 'registrosVisitas/venecia'), orderByChild('timestamp')),
      samaria: query(ref(db, 'registrosVisitas/samaria'), orderByChild('timestamp'))
    };

    const listeners = Object.entries(refs).map(([tipo, ref]) => {
      return onValue(ref, (snapshot) => {
        const data = snapshot.val();
        let registrosArray = data ? Object.entries(data).map(([id, registro]) => ({
          id,
          ...registro
        })) : [];

        // Filtrar registros para mostrar solo los del usuario actual
        registrosArray = registrosArray.filter(registro => registro.usuario === usuario);

        setRegistros(prev => ({
          ...prev,
          [tipo]: registrosArray
        }));

        // Verificar rutas activas solo del usuario actual
        const rutaActivaUsuario = registrosArray.find(r => 
          r.estado === 'en_progreso' && r.usuario === usuario
        );

        setRutasActivas(prev => ({
          ...prev,
          [tipo]: rutaActivaUsuario ? rutaActivaUsuario.id : null
        }));
      });
    });

    return () => {
      Object.entries(refs).forEach(([tipo, ref], index) => {
        off(ref, 'value', listeners[index]);
      });
    };
  }, [usuario]);

  // Manejar inicio/fin de actividad
  const manejarActividad = async (tipo) => {
    if (rutasActivas[tipo]) {
      // Finalizar la ruta activa del usuario actual
      await guardarRegistro(tipo, 'Finalizado', rutasActivas[tipo]);
      setRutasActivas(prev => ({...prev, [tipo]: null}));
    } else {
      // Verificar si el usuario tiene rutas activas en otras secciones
      const tieneOtrasRutasActivas = Object.entries(rutasActivas).some(
        ([key, value]) => key !== tipo && value !== null
      );
      
      if (tieneOtrasRutasActivas) {
        alert('Tienes una ruta activa en otra sección. Por favor, finalízala primero.');
        return;
      }

      const registroId = await guardarRegistro(tipo, 'Iniciado');
      if (registroId) {
        setRutasActivas(prev => ({...prev, [tipo]: registroId}));
      }
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem('nombreUsuario');
    navigate('/log');
  };

  useEffect(() => {
    const limpiarWatcher = obtenerUbicacion();
    return limpiarWatcher;
  }, []);

  // Componente de tabla reutilizable
  const TablaRegistros = ({ registros }) => (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Operario</th>
          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Fecha</th>
          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Hora Inicio</th>
          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Ubicación Inicial</th>
          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Hora Final</th>
          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Ubicación Final</th>
          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Estado</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {registros.map((registro) => (
          <tr key={registro.id}>
            <td className="px-4 py-2 text-sm">{registro.usuario}</td>
            <td className="px-4 py-2 text-sm">{registro.fecha}</td>
            <td className="px-4 py-2 text-sm">{registro.horaInicio}</td>
            <td className="px-4 py-2 text-sm">
              {registro.ubicacionInicial?.lat}, {registro.ubicacionInicial?.lng}
            </td>
            <td className="px-4 py-2 text-sm">{registro.horaFinal || '-'}</td>
            <td className="px-4 py-2 text-sm">
              {registro.ubicacionFinal ? `${registro.ubicacionFinal.lat}, ${registro.ubicacionFinal.lng}` : '-'}
            </td>
            <td className="px-4 py-2 text-sm">
              <span className={`px-2 py-1 rounded-full text-xs ${
                registro.estado === 'en_progreso' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
              }`}>
                {registro.estado === 'en_progreso' ? 'En progreso' : 'Completado'}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  // Sección reutilizable
  const SeccionRegistro = ({ tipo, nombre }) => (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <button
        className="w-full p-4 bg-blue-500 text-white text-left font-bold flex justify-between items-center"
        onClick={() => setSeccionActiva(seccionActiva === tipo ? null : tipo)}
      >
        <span>{nombre} {rutasActivas[tipo] && "(En progreso)"}</span>
        <span>{seccionActiva === tipo ? '▲' : '▼'}</span>
      </button>
      
      {seccionActiva === tipo && (
        <div className="p-4 space-y-4">
          <button
            onClick={() => manejarActividad(tipo)}
            className={`px-6 py-3 rounded-md font-bold text-white ${
              rutasActivas[tipo] ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {rutasActivas[tipo] ? `Finalizar ${nombre}` : `Iniciar ${nombre}`}
          </button>
          
          <div className="overflow-x-auto">
            <h3 className="font-bold mb-2">Historial {nombre}</h3>
            {registros[tipo].length > 0 ? (
              <TablaRegistros registros={registros[tipo]} />
            ) : (
              <p className="text-center text-gray-500 py-4">No hay registros para {nombre}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 rounded-lg shadow-md mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Registro de Visitas</h1>
          <p className="text-sm">Usuario: {usuario}</p>
          {ubicacion && (
            <p className="text-xs">Ubicación: {ubicacion.lat}, {ubicacion.lng} (Precisión: {ubicacion.precision}m)</p>
          )}
          {errorUbicacion && (
            <p className="text-xs text-yellow-300">{errorUbicacion}</p>
          )}
        </div>
        <button 
          onClick={cerrarSesion}
          className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-sm"
        >
          Cerrar sesión
        </button>
      </header>

      {/* Secciones desplegables */}
      <div className="space-y-4">
        <SeccionRegistro tipo="bocatoma" nombre="Visita Bocatoma" />
        <SeccionRegistro tipo="venecia" nombre="Recorrido Predios Venecia" />
        <SeccionRegistro tipo="samaria" nombre="Recorrido Predios Samaria" />
      </div>
    </div>
  );
};

export default RegistroVisitas;