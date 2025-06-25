import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDatabase, ref, onValue, off, query, orderByChild, remove } from 'firebase/database';
import app from '../FirebaseConfiguration';

const VisualizacionRegistros = () => {
  const [seccionActiva, setSeccionActiva] = useState(null);
  const [registros, setRegistros] = useState({
    bocatoma: [],
    venecia: [],
    samaria: []
  });
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [eliminandoId, setEliminandoId] = useState(null);
  const navigate = useNavigate();

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
        
        registrosArray.sort((a, b) => b.timestamp - a.timestamp);

        setRegistros(prev => ({
          ...prev,
          [tipo]: registrosArray
        }));
      });
    });

    return () => {
      Object.entries(refs).forEach(([tipo, ref], index) => {
        off(ref, 'value', listeners[index]);
      });
    };
  }, []);

  const cerrarSesion = () => {
    localStorage.removeItem('nombreUsuario');
    navigate('/log');
  };

  const eliminarRegistro = async (tipo, id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este registro?')) {
      try {
        setEliminandoId(id);
        const db = getDatabase(app);
        await remove(ref(db, `registrosVisitas/${tipo}/${id}`));
      } catch (error) {
        console.error('Error al eliminar registro:', error);
        alert('Ocurrió un error al eliminar el registro');
      } finally {
        setEliminandoId(null);
      }
    }
  };

  // Componente para coordenadas
  const CoordenadasCell = ({ ubicacion }) => {
    if (!ubicacion?.lat || !ubicacion?.lng) return '-';
    
    const lat = parseFloat(ubicacion.lat).toFixed(6);
    const lng = parseFloat(ubicacion.lng).toFixed(6);
    
    if (isNaN(lat) || isNaN(lng)) return 'Datos inválidos';

    return (
      <a
        href={`https://www.google.com/maps?q=${lat},${lng}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-500 hover:underline"
        title="Ver en Google Maps"
      >
        {lat}, {lng}
      </a>
    );
  };

  // Componente de tabla responsive
  const TablaRegistros = ({ tipo, registros }) => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Usuario</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Fecha</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Hora Inicio</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Ubicación</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Hora Final</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Ubicación Final</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Estado</th>
            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Acciones</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {registros.map((registro) => (
            <tr key={registro.id} className="hover:bg-gray-50">
              <td className="px-3 py-2 text-sm whitespace-nowrap">{registro.usuario}</td>
              <td className="px-3 py-2 text-sm whitespace-nowrap">{registro.fecha}</td>
              <td className="px-3 py-2 text-sm whitespace-nowrap">{registro.horaInicio}</td>
              <td className="px-3 py-2 text-sm">
                <CoordenadasCell ubicacion={registro.ubicacionInicial} />
              </td>
              <td className="px-3 py-2 text-sm whitespace-nowrap">{registro.horaFinal || '-'}</td>
              <td className="px-3 py-2 text-sm">
                <CoordenadasCell ubicacion={registro.ubicacionFinal} />
              </td>
              <td className="px-3 py-2 text-sm whitespace-nowrap">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  registro.estado === 'en_progreso' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                }`}>
                  {registro.estado === 'en_progreso' ? 'En curso' : 'Completado'}
                </span>
              </td>
              <td className="px-3 py-2 text-sm whitespace-nowrap">
                <button
                  onClick={() => eliminarRegistro(tipo, registro.id)}
                  disabled={eliminandoId === registro.id}
                  className={`text-red-500 hover:text-red-700 p-1 rounded ${
                    eliminandoId === registro.id ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-50'
                  }`}
                  title="Eliminar registro"
                >
                  {eliminandoId === registro.id ? (
                    <svg className="animate-spin h-4 w-4 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Sección responsive
  const SeccionRegistro = ({ tipo, nombre }) => (
    <div className="bg-white rounded-lg shadow overflow-hidden mb-4">
      <button
        className="w-full p-4 bg-blue-600 text-white text-left font-bold flex justify-between items-center hover:bg-blue-700 transition-colors"
        onClick={() => setSeccionActiva(seccionActiva === tipo ? null : tipo)}
      >
        <span>{nombre}</span>
        <span className="text-lg">{seccionActiva === tipo ? '↑' : '↓'}</span>
      </button>
      
      {seccionActiva === tipo && (
        <div className="p-4 border-t border-gray-200">
          {registros[tipo].length > 0 ? (
            <TablaRegistros tipo={tipo} registros={registros[tipo]} />
          ) : (
            <p className="text-center text-gray-500 py-4">No hay registros para {nombre}</p>
          )}
        </div>
      )}
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
          {/* Header simplificado */}
          <header className="bg-blue-700 text-white p-4 rounded-lg shadow-md mb-6">
            <h1 className="text-xl md:text-2xl font-bold">Visualización de todas las visitas</h1>
          </header>

          {/* Secciones de registros */}
          <div className="space-y-4">
            <SeccionRegistro tipo="bocatoma" nombre="Visitas a Bocatoma" />
            <SeccionRegistro tipo="venecia" nombre="Recorridos Predios Venecia" />
            <SeccionRegistro tipo="samaria" nombre="Recorridos Predios Samaria" />
          </div>
        </div>
      </main>
    </div>
  );
};

export default VisualizacionRegistros;