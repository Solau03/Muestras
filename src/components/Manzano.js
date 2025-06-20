import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDatabase, ref, push, onValue, off, query, orderByChild, update } from 'firebase/database';
import app from '../FirebaseConfiguration';

const RegistroCloroPH = () => {
  const [seccionActiva, setSeccionActiva] = useState('aplicacion');
  const [ubicacion, setUbicacion] = useState(null);
  const [errorUbicacion, setErrorUbicacion] = useState(null);
  const [registrosCloro, setRegistrosCloro] = useState([]);
  const [registrosPH, setRegistrosPH] = useState([]);
  const [formData, setFormData] = useState({
    ph: '',
    cloro: '',
    observaciones: ''
  });
  const [errores, setErrores] = useState({});
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

  // Guardar registro de aplicación de cloro
  const aplicarCloro = async () => {
    const db = getDatabase(app);
    const ahora = new Date();
    
    const registroData = {
      usuario,
      fecha: ahora.toLocaleDateString(),
      hora: ahora.toLocaleTimeString(),
      ubicacion: ubicacion || { lat: 'N/A', lng: 'N/A', precision: 'N/A' },
      timestamp: Date.now()
    };

    try {
      await push(ref(db, 'registrosCloro'), registroData);
      alert('Aplicación de cloro registrada correctamente');
    } catch (error) {
      console.error('Error guardando en Firebase:', error);
      alert('Error al registrar la aplicación de cloro');
    }
  };

  // Guardar registro de pH y cloro
  const registrarPHCloro = async () => {
    // Validar los datos
    const nuevosErrores = {};
    
    if (!formData.ph || isNaN(formData.ph)) {
      nuevosErrores.ph = 'El pH debe ser un número válido';
    } else if (parseFloat(formData.ph) < 6.5 || parseFloat(formData.ph) > 9) {
      nuevosErrores.ph = 'El pH debe estar entre 6.5 y 9';
    }
    
    if (!formData.cloro || isNaN(formData.cloro)) {
      nuevosErrores.cloro = 'El cloro debe ser un número válido';
    } else if (parseFloat(formData.cloro) < 0.3 || parseFloat(formData.cloro) > 2.0) {
      nuevosErrores.cloro = 'El cloro debe estar entre 0.3 y 2.0';
    }
    
    setErrores(nuevosErrores);
    
    if (Object.keys(nuevosErrores).length > 0) {
      return;
    }

    const db = getDatabase(app);
    const ahora = new Date();
    
    const registroData = {
      usuario,
      ph: parseFloat(formData.ph),
      cloro: parseFloat(formData.cloro),
      observaciones: formData.observaciones,
      fecha: ahora.toLocaleDateString(),
      hora: ahora.toLocaleTimeString(),
      ubicacion: ubicacion || { lat: 'N/A', lng: 'N/A', precision: 'N/A' },
      timestamp: Date.now()
    };

    try {
      await push(ref(db, 'registrosPHCloro'), registroData);
      alert('Registro de pH y cloro guardado correctamente');
      setFormData({
        ph: '',
        cloro: '',
        observaciones: ''
      });
    } catch (error) {
      console.error('Error guardando en Firebase:', error);
      alert('Error al guardar el registro');
    }
  };

  // Cargar registros desde Firebase
  useEffect(() => {
    const db = getDatabase(app);
    
    // Cargar registros de aplicación de cloro
    const refCloro = query(ref(db, 'registrosCloro'), orderByChild('timestamp'));
    const listenerCloro = onValue(refCloro, (snapshot) => {
      const data = snapshot.val();
      const registrosArray = data ? Object.entries(data).map(([id, registro]) => ({
        id,
        ...registro
      })) : [];
      
      // Ordenar del más reciente al más antiguo
      registrosArray.sort((a, b) => b.timestamp - a.timestamp);
      setRegistrosCloro(registrosArray);
    });

    // Cargar registros de pH y cloro
    const refPH = query(ref(db, 'registrosPHCloro'), orderByChild('timestamp'));
    const listenerPH = onValue(refPH, (snapshot) => {
      const data = snapshot.val();
      const registrosArray = data ? Object.entries(data).map(([id, registro]) => ({
        id,
        ...registro
      })) : [];
      
      // Ordenar del más reciente al más antiguo
      registrosArray.sort((a, b) => b.timestamp - a.timestamp);
      setRegistrosPH(registrosArray);
    });

    return () => {
      off(refCloro, 'value', listenerCloro);
      off(refPH, 'value', listenerPH);
    };
  }, []);

  const cerrarSesion = () => {
    localStorage.removeItem('nombreUsuario');
    navigate('/login');
  };

  useEffect(() => {
    const limpiarWatcher = obtenerUbicacion();
    return limpiarWatcher;
  }, []);

  // Componente de tabla para registros de cloro
  const TablaCloro = ({ registros }) => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Operario</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Fecha</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Hora</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Ubicación</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {registros.map((registro) => (
            <tr key={registro.id}>
              <td className="px-4 py-2 text-sm">{registro.usuario}</td>
              <td className="px-4 py-2 text-sm">{registro.fecha}</td>
              <td className="px-4 py-2 text-sm">{registro.hora}</td>
              <td className="px-4 py-2 text-sm">
                {registro.ubicacion.lat}, {registro.ubicacion.lng}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {registros.length === 0 && (
        <p className="text-center text-gray-500 py-4">No hay registros de aplicación de cloro</p>
      )}
    </div>
  );

  // Componente de tabla para registros de pH y cloro
  const TablaPHCloro = ({ registros }) => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Operario</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">pH</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Cloro (ppm)</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Fecha</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Hora</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Ubicación</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {registros.map((registro) => (
            <tr key={registro.id}>
              <td className="px-4 py-2 text-sm">{registro.usuario}</td>
              <td className="px-4 py-2 text-sm">{registro.ph}</td>
              <td className="px-4 py-2 text-sm">{registro.cloro}</td>
              <td className="px-4 py-2 text-sm">{registro.fecha}</td>
              <td className="px-4 py-2 text-sm">{registro.hora}</td>
              <td className="px-4 py-2 text-sm">
                {registro.ubicacion.lat}, {registro.ubicacion.lng}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {registros.length === 0 && (
        <p className="text-center text-gray-500 py-4">No hay registros de pH y cloro</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 rounded-lg shadow-md mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">Registro de Cloro y pH</h1>
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

      {/* Navegación entre secciones */}
      <div className="flex mb-4 border-b border-gray-200">
        <button
          className={`py-2 px-4 font-medium ${seccionActiva === 'aplicacion' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setSeccionActiva('aplicacion')}
        >
          Aplicación de Cloro
        </button>
        <button
          className={`py-2 px-4 font-medium ${seccionActiva === 'phcloro' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
          onClick={() => setSeccionActiva('phcloro')}
        >
          Registro de pH y Cloro
        </button>
      </div>

      {/* Sección de Aplicación de Cloro */}
      {seccionActiva === 'aplicacion' && (
        <div className="bg-white rounded-lg shadow overflow-hidden p-4 space-y-4">
          <button
            onClick={aplicarCloro}
            className="px-6 py-3 rounded-md font-bold text-white bg-green-500 hover:bg-green-600"
          >
            Aplicar Cloro
          </button>
          
          <h3 className="font-bold text-lg">Historial de Aplicaciones</h3>
          <TablaCloro registros={registrosCloro} />
        </div>
      )}

      {/* Sección de Registro de pH y Cloro */}
      {seccionActiva === 'phcloro' && (
        <div className="bg-white rounded-lg shadow overflow-hidden p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">pH (6.5 - 9)</label>
              <input
                type="number"
                step="0.1"
                min="6.5"
                max="9"
                value={formData.ph}
                onChange={(e) => setFormData({...formData, ph: e.target.value})}
                className={`w-full p-2 border rounded ${errores.ph ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Ej. 7.2"
              />
              {errores.ph && <p className="text-red-500 text-xs mt-1">{errores.ph}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cloro (0.3 - 2.0 ppm)</label>
              <input
                type="number"
                step="0.1"
                min="0.3"
                max="2.0"
                value={formData.cloro}
                onChange={(e) => setFormData({...formData, cloro: e.target.value})}
                className={`w-full p-2 border rounded ${errores.cloro ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Ej. 1.2"
              />
              {errores.cloro && <p className="text-red-500 text-xs mt-1">{errores.cloro}</p>}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
            <textarea
              value={formData.observaciones}
              onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
              className="w-full p-2 border border-gray-300 rounded"
              rows="3"
              placeholder="Observaciones adicionales..."
            />
          </div>
          
          <button
            onClick={registrarPHCloro}
            className="px-6 py-3 rounded-md font-bold text-white bg-blue-500 hover:bg-blue-600"
          >
            Registrar pH y Cloro
          </button>
          
          <h3 className="font-bold text-lg">Historial de Mediciones</h3>
          <TablaPHCloro registros={registrosPH} />
        </div>
      )}
    </div>
  );
};

export default RegistroCloroPH;