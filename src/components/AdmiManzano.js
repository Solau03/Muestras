import React, { useState, useEffect, useMemo } from 'react';
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

  // Estados para paginación
  const [paginaActualCloro, setPaginaActualCloro] = useState(1);
  const [paginaActualPH, setPaginaActualPH] = useState(1);
  const [registrosPorPagina] = useState(10);

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
      setPaginaActualCloro(1); // Volver a la primera página
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
      setPaginaActualPH(1); // Volver a la primera página
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

  // Cálculos de paginación para Cloro
  const totalPaginasCloro = Math.ceil(registrosCloro.length / registrosPorPagina);
  const registrosCloroPaginaActual = useMemo(() => {
    const inicio = (paginaActualCloro - 1) * registrosPorPagina;
    const fin = inicio + registrosPorPagina;
    return registrosCloro.slice(inicio, fin);
  }, [registrosCloro, paginaActualCloro, registrosPorPagina]);

  // Cálculos de paginación para PH/Cloro
  const totalPaginasPH = Math.ceil(registrosPH.length / registrosPorPagina);
  const registrosPHPaginaActual = useMemo(() => {
    const inicio = (paginaActualPH - 1) * registrosPorPagina;
    const fin = inicio + registrosPorPagina;
    return registrosPH.slice(inicio, fin);
  }, [registrosPH, paginaActualPH, registrosPorPagina]);

  // Función para cambiar página genérica
  const cambiarPagina = (tipo, numeroPagina) => {
    if (tipo === 'cloro') {
      setPaginaActualCloro(numeroPagina);
    } else {
      setPaginaActualPH(numeroPagina);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  // Componente de paginación reutilizable
  const Paginacion = ({ tipo, paginaActual, totalPaginas }) => (
    <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-t border-gray-200">
      <div className="text-sm text-gray-500">
        Página {paginaActual} de {totalPaginas}
      </div>
      <nav className="flex space-x-1">
        <button
          onClick={() => cambiarPagina(tipo, paginaActual - 1)}
          disabled={paginaActual === 1}
          className="px-3 py-1 rounded border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Anterior
        </button>
        
        {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
          // Mostrar solo 5 páginas alrededor de la actual
          let pagina;
          if (totalPaginas <= 5) {
            pagina = i + 1;
          } else if (paginaActual <= 3) {
            pagina = i + 1;
          } else if (paginaActual >= totalPaginas - 2) {
            pagina = totalPaginas - 4 + i;
          } else {
            pagina = paginaActual - 2 + i;
          }
          
          return (
            <button
              key={pagina}
              onClick={() => cambiarPagina(tipo, pagina)}
              className={`px-3 py-1 rounded border text-sm font-medium ${
                paginaActual === pagina 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {pagina}
            </button>
          );
        })}
        
        <button
          onClick={() => cambiarPagina(tipo, paginaActual + 1)}
          disabled={paginaActual === totalPaginas}
          className="px-3 py-1 rounded border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Siguiente
        </button>
      </nav>
    </div>
  );

  // Componente de tabla para registros de cloro
  const TablaCloro = ({ registros }) => (
    <div className="overflow-x-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800">Historial de Aplicaciones de Cloro</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            Total: {registros.length} registros
          </span>
          <button 
            onClick={() => exportarAExcel(registros, 'registros_cloro')}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={registros.length === 0}
          >
            Exportar Excel
          </button>
        </div>
      </div>
      
      <div className="shadow overflow-hidden border-b border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operario</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {registrosCloroPaginaActual.length > 0 ? (
              registrosCloroPaginaActual.map((registro) => (
                <tr key={registro.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{registro.usuario}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{registro.fecha}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{registro.hora}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <UbicacionCell ubicacion={registro.ubicacion} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button 
                      onClick={() => eliminarRegistroCloro(registro.id)}
                      className="text-red-600 hover:text-red-900 font-medium"
                      title="Eliminar registro"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-400">
                  No hay registros de aplicación de cloro
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        {registros.length > 0 && (
          <Paginacion 
            tipo="cloro" 
            paginaActual={paginaActualCloro} 
            totalPaginas={totalPaginasCloro} 
          />
        )}
      </div>
    </div>
  );

  // Componente de tabla para registros de pH y cloro
  const TablaPHCloro = ({ registros }) => (
    <div className="overflow-x-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800">Historial de Mediciones de pH y Cloro</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            Total: {registros.length} registros
          </span>
          <button 
            onClick={() => exportarAExcel(registros, 'registros_ph_cloro')}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={registros.length === 0}
          >
            Exportar Excel
          </button>
        </div>
      </div>
      
      <div className="shadow overflow-hidden border-b border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Operario</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">pH</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cloro (ppm)</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {registrosPHPaginaActual.length > 0 ? (
              registrosPHPaginaActual.map((registro) => (
                <tr key={registro.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{registro.usuario}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{registro.ph}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{registro.cloro}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{registro.fecha}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{registro.hora}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <UbicacionCell ubicacion={registro.ubicacion} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button 
                      onClick={() => eliminarRegistroPHCloro(registro.id)}
                      className="text-red-600 hover:text-red-900 font-medium"
                      title="Eliminar registro"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-400">
                  No hay registros de pH y cloro
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        {registros.length > 0 && (
          <Paginacion 
            tipo="ph" 
            paginaActual={paginaActualPH} 
            totalPaginas={totalPaginasPH} 
          />
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
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                <h3 className="font-bold text-blue-800">Instrucciones:</h3>
                <p className="text-blue-700">Presione el botón "Aplicar Cloro" para registrar una nueva aplicación.</p>
              </div>
              
              <button
                onClick={aplicarCloro}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded shadow"
              >
                Aplicar Cloro
              </button>
              
              <TablaCloro registros={registrosCloro} />
            </div>
          )}

          {/* Sección de Registro de pH y Cloro */}
          {seccionActiva === 'phcloro' && (
            <div className="bg-white rounded-lg shadow overflow-hidden p-6 space-y-6">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                <h3 className="font-bold text-blue-800">Instrucciones:</h3>
                <p className="text-blue-700">Complete los campos de pH y Cloro para registrar una nueva medición.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="ph" className="block text-sm font-medium text-gray-700 mb-1">pH</label>
                  <input
                    type="number"
                    step="0.1"
                    id="ph"
                    value={formData.ph}
                    onChange={(e) => setFormData({...formData, ph: e.target.value})}
                    className={`w-full px-3 py-2 border ${errores.ph ? 'border-red-500 bg-red-50' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="Ej: 7.2"
                  />
                  {errores.ph && <p className="mt-1 text-sm text-red-600">{errores.ph}</p>}
                </div>
                
                <div>
                  <label htmlFor="cloro" className="block text-sm font-medium text-gray-700 mb-1">Cloro (ppm)</label>
                  <input
                    type="number"
                    step="0.1"
                    id="cloro"
                    value={formData.cloro}
                    onChange={(e) => setFormData({...formData, cloro: e.target.value})}
                    className={`w-full px-3 py-2 border ${errores.cloro ? 'border-red-500 bg-red-50' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    placeholder="Ej: 1.2"
                  />
                  {errores.cloro && <p className="mt-1 text-sm text-red-600">{errores.cloro}</p>}
                </div>
              </div>
              
              <button
                onClick={registrarPHCloro}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded shadow"
              >
                Registrar pH y Cloro
              </button>
              
              <TablaPHCloro registros={registrosPH} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdmiRegistroCloroPH;