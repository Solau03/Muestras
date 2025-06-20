import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDatabase, ref, onValue, off, query, orderByChild } from 'firebase/database';
import app from '../FirebaseConfiguration';

const VisualizacionRegistros = () => {
  const [seccionActiva, setSeccionActiva] = useState(null);
  const [registros, setRegistros] = useState({
    bocatoma: [],
    venecia: [],
    samaria: []
  });
  const navigate = useNavigate();
  const usuario = localStorage.getItem('nombreUsuario') || 'Operario';

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
        
        // Ordenar por timestamp descendente (más reciente primero)
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

  // Componente para mostrar coordenadas con enlace a Google Maps
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

  // Componente de tabla mejorada
  const TablaRegistros = ({ registros }) => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Usuario</th>
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
                <CoordenadasCell ubicacion={registro.ubicacionInicial} />
              </td>
              <td className="px-4 py-2 text-sm">{registro.horaFinal || '-'}</td>
              <td className="px-4 py-2 text-sm">
                <CoordenadasCell ubicacion={registro.ubicacionFinal} />
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
    </div>
  );

  // Sección reutilizable mejorada
  const SeccionRegistro = ({ tipo, nombre }) => (
    <div className="bg-white rounded-lg shadow overflow-hidden mb-4">
      <button
        className="w-full p-4 bg-blue-600 text-white text-left font-bold flex justify-between items-center hover:bg-blue-700 transition-colors"
        onClick={() => setSeccionActiva(seccionActiva === tipo ? null : tipo)}
      >
        <span>{nombre}</span>
        <span className="text-lg">{seccionActiva === tipo ? '▲' : '▼'}</span>
      </button>
      
      {seccionActiva === tipo && (
        <div className="p-4 border-t border-gray-200">
          {registros[tipo].length > 0 ? (
            <TablaRegistros registros={registros[tipo]} />
          ) : (
            <p className="text-center text-gray-500 py-4">No hay registros para {nombre}</p>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      {/* Header mejorado */}
      <header className="bg-blue-700 text-white p-4 rounded-lg shadow-md mb-6 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div className="mb-2 md:mb-0">
          <h1 className="text-xl md:text-2xl font-bold">Registro Completo de Visitas</h1>
          <p className="text-sm opacity-90">Usuario actual: {usuario}</p>
        </div>
        <button 
          onClick={cerrarSesion}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm transition-colors"
        >
          Cerrar sesión
        </button>
      </header>

      {/* Contenedor de secciones */}
      <div className="space-y-4">
        <SeccionRegistro tipo="bocatoma" nombre="Visitas a Bocatoma" />
        <SeccionRegistro tipo="venecia" nombre="Recorridos Predios Venecia" />
        <SeccionRegistro tipo="samaria" nombre="Recorridos Predios Samaria" />
      </div>
    </div>
  );
};

export default VisualizacionRegistros;