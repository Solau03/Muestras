import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDatabase, ref, push, onValue, off, query, orderByChild, remove } from 'firebase/database';
import app from '../FirebaseConfiguration';
import * as XLSX from 'xlsx';

const AdmiRegistroCloroPH = () => {
  const [seccionActiva, setSeccionActiva] = useState('aplicacion');
  const [ubicacion, setUbicacion] = useState(null);
  const [errorUbicacion, setErrorUbicacion] = useState(null);
  const [registrosCloro, setRegistrosCloro] = useState([]);
  const [registrosPH, setRegistrosPH] = useState([]);
  const [formData, setFormData] = useState({
    ph: '',
    cloro: ''
  });
  const [errores, setErrores] = useState({});
  const [menuAbierto, setMenuAbierto] = useState(false);
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

  // Eliminar registro de cloro
  const eliminarRegistroCloro = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este registro?')) return;
    
    const db = getDatabase(app);
    try {
      await remove(ref(db, `registrosCloro/${id}`));
      alert('Registro eliminado correctamente');
    } catch (error) {
      console.error('Error eliminando registro:', error);
      alert('Error al eliminar el registro');
    }
  };

  // Eliminar registro de pH/cloro
  const eliminarRegistroPHCloro = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este registro?')) return;
    
    const db = getDatabase(app);
    try {
      await remove(ref(db, `registrosPHCloro/${id}`));
      alert('Registro eliminado correctamente');
    } catch (error) {
      console.error('Error eliminando registro:', error);
      alert('Error al eliminar el registro');
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
        cloro: ''
      });
    } catch (error) {
      console.error('Error guardando en Firebase:', error);
      alert('Error al guardar el registro');
    }
  };

  // Cargar registros desde Firebase
  useEffect(() => {
    const db = getDatabase(app);
    
    const refCloro = query(ref(db, 'registrosCloro'), orderByChild('timestamp'));
    const listenerCloro = onValue(refCloro, (snapshot) => {
      const data = snapshot.val();
      const registrosArray = data ? Object.entries(data).map(([id, registro]) => ({
        id,
        ...registro
      })) : [];
      
      registrosArray.sort((a, b) => b.timestamp - a.timestamp);
      setRegistrosCloro(registrosArray);
    });

    const refPH = query(ref(db, 'registrosPHCloro'), orderByChild('timestamp'));
    const listenerPH = onValue(refPH, (snapshot) => {
      const data = snapshot.val();
      const registrosArray = data ? Object.entries(data).map(([id, registro]) => ({
        id,
        ...registro
      })) : [];
      
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

  // Componente para mostrar coordenadas con enlace a Google Maps
  const UbicacionCell = ({ ubicacion }) => {
    if (!ubicacion?.lat || !ubicacion?.lng || ubicacion.lat === 'N/A') return '-';
    
    return (
      <a
        href={`https://www.google.com/maps?q=${ubicacion.lat},${ubicacion.lng}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 hover:underline"
        title="Ver en Google Maps"
      >
        {ubicacion.lat}, {ubicacion.lng}
      </a>
    );
  };

  // Exportar a Excel
  const exportarAExcel = (datos, nombreArchivo) => {
    const datosFormateados = datos.map(registro => ({
      'Operario': registro.usuario,
      'Fecha': registro.fecha,
      'Hora': registro.hora,
      'Ubicación': registro.ubicacion.lat !== 'N/A' ? `${registro.ubicacion.lat}, ${registro.ubicacion.lng}` : 'N/A',
      ...(registro.ph && { 'pH': registro.ph }),
      ...(registro.cloro && { 'Cloro (ppm)': registro.cloro })
    }));

    const libro = XLSX.utils.book_new();
    const hoja = XLSX.utils.json_to_sheet(datosFormateados);
    XLSX.utils.book_append_sheet(libro, hoja, 'Registros');
    XLSX.writeFile(libro, `${nombreArchivo}.xlsx`);
  };

  // Componente de tabla para registros de cloro
  const TablaCloro = ({ registros }) => (
    <div className="overflow-x-auto">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-lg">Historial de Aplicaciones</h3>
        <button 
          onClick={() => exportarAExcel(registros, 'registros_cloro')}
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
        >
          Exportar a Excel
        </button>
      </div>
      <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operario</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {registros.map((registro) => (
              <tr key={registro.id}>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{registro.usuario}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{registro.fecha}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{registro.hora}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  <UbicacionCell ubicacion={registro.ubicacion} />
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button 
                    onClick={() => eliminarRegistroCloro(registro.id)}
                    className="text-red-600 hover:text-red-900"
                    title="Eliminar registro"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {registros.length === 0 && (
          <div className="bg-white p-4 text-center text-gray-500">
            No hay registros de aplicación de cloro
          </div>
        )}
      </div>
    </div>
  );

  // Componente de tabla para registros de pH y cloro
  const TablaPHCloro = ({ registros }) => (
    <div className="overflow-x-auto">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-lg">Historial de Mediciones</h3>
        <button 
          onClick={() => exportarAExcel(registros, 'registros_ph_cloro')}
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
        >
          Exportar a Excel
        </button>
      </div>
      <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operario</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">pH</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cloro (ppm)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {registros.map((registro) => (
              <tr key={registro.id}>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{registro.usuario}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{registro.ph}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{registro.cloro}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{registro.fecha}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{registro.hora}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  <UbicacionCell ubicacion={registro.ubicacion} />
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button 
                    onClick={() => eliminarRegistroPHCloro(registro.id)}
                    className="text-red-600 hover:text-red-900"
                    title="Eliminar registro"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {registros.length === 0 && (
          <div className="bg-white p-4 text-center text-gray-500">
            No hay registros de pH y cloro
          </div>
        )}
      </div>
    </div>
  );

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
      {/* Mobile menu button */}
      <button 
        className="md:hidden fixed top-4 left-4 z-40 bg-blue-600 text-white p-2 rounded-full shadow-lg"
        onClick={() => setMenuAbierto(!menuAbierto)}
      >
        {menuAbierto ? '✕' : '☰'}
      </button>

      <div className="max-w-6xl mx-auto">
        <header className="bg-blue-600 text-white p-4 rounded-lg shadow-md mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              
              <h1 className="text-xl font-bold">Registro de Cloro y pH</h1>
            </div> 
          </div>
        </header>

        {/* Navegación entre secciones */}
        <div className="flex mb-6 border-b border-gray-200 overflow-x-auto">
          <button
            className={`py-3 px-6 font-medium whitespace-nowrap ${seccionActiva === 'aplicacion' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setSeccionActiva('aplicacion')}
          >
            Aplicación de Cloro
          </button>
          <button
            className={`py-3 px-6 font-medium whitespace-nowrap ${seccionActiva === 'phcloro' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setSeccionActiva('phcloro')}
          >
            Registro de pH y Cloro
          </button>
        </div>

        {/* Sección de Aplicación de Cloro */}
        {seccionActiva === 'aplicacion' && (
          <div className="bg-white rounded-lg shadow overflow-hidden p-6 space-y-6">
            <TablaCloro registros={registrosCloro} />
          </div>
        )}

        {/* Sección de Registro de pH y Cloro */}
        {seccionActiva === 'phcloro' && (
          <div className="bg-white rounded-lg shadow overflow-hidden p-6 space-y-6">
            <TablaPHCloro registros={registrosPH} />
          </div>
        )}
      </div>
    </main>
  </div>
);
}

export default AdmiRegistroCloroPH;