import React, { useState, useEffect } from "react";
import app from "../FirebaseConfiguration";
import { getDatabase, ref, set, push, onValue } from "firebase/database";
import { useNavigate } from "react-router-dom";

function BocMuestras() {
  const [turbiedad, setTurbiedad] = useState("");
  const [ph, setPh] = useState("");
  const [color, setColor] = useState("");
  const [cloro, setCloro] = useState("");
  const [muestras, setMuestras] = useState([]);
  const navigate = useNavigate();
  const nombreUsuario = localStorage.getItem("nombreUsuario") || "Desconocido";
  const [errores, setErrores] = useState({
      turbiedad: false,
      ph: false,
      color: false,
      cloro: false,
      formato: false
    });

  const db = getDatabase(app);

  useEffect(() => {
    const muestrasRef = ref(db, "muestras/muestras");

    const unsubscribe = onValue(muestrasRef, (snapshot) => {
      const data = snapshot.val();
      const lista = data ? Object.values(data) : [];
      setMuestras(lista.reverse()); // Para mostrar las más recientes arriba
    });

    // Limpieza del listener
    return () => unsubscribe();
  }, [db]);

  const guardarDatos = async () => {
    const nombreUsuario = localStorage.getItem("nombreUsuario") || "Desconocido";
    const fecha = new Date().toLocaleDateString(); // formato: dd/mm/yyyy
    const hora = new Date().toLocaleTimeString(); // formato: hh:mm:ss

    // Validar que los campos sean números válidos
    const phNum = parseFloat(ph);
    const turbNum = parseFloat(turbiedad);
    const colorNum = parseFloat(color);
    const cloroNum = parseFloat(cloro);

    if (isNaN(phNum) || isNaN(turbNum) || isNaN(colorNum) || isNaN(cloroNum)) {
      alert("Todos los campos deben ser números válidos.");
      return;
    }

    // Validaciones de rangos
    if (!(phNum >= 6.5 && phNum <= 9)) {
      alert("El pH debe estar entre 6.5 y 9.");
      return;
    }
    if (!(turbNum <= 2)) {
      alert("La turbiedad debe ser menor o igual a 2.");
      return;
    }
    if (!(colorNum <= 15)) {
      alert("El color debe ser menor o igual a 15.");
      return;
    }
    if (!(cloroNum >= 0.3 && cloroNum <= 2.0)) {
      alert("El cloro debe estar entre 0.3 y 2.0.");
      return;
    }

    const newDocRef = push(ref(db, "muestras/muestras"));

    set(newDocRef, {
      nombreUsuario,
      Turbiedad: turbiedad,
      Ph: ph,
      Cloro: cloro,
      Color: color,
      Fecha: fecha,
      Hora: hora
    })
      .then(() => {
        alert("Se registró la muestra exitosamente");
        setTurbiedad("");
        setPh("");
        setColor("");
        setCloro("");
      })
      .catch((error) => {
        alert("Error: " + error.message);
      });
  };
   const cerrarSesion = () => {
    // Limpiar localStorage y redirigir al login
    localStorage.removeItem("nombreUsuario");
    localStorage.removeItem("tipoUsuario");
    navigate("/log");
  };

  return (
    
 <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
  {/* Header responsive */}
  <header className="bg-blue-400 text-white shadow-md w-full">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
      <div className="text-center sm:text-left">
        <h1 className="text-xl sm:text-2xl font-bold">Bienvenido</h1>
        <p className="text-xs sm:text-sm">👤 {nombreUsuario}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
        <button 
          onClick={() => navigate("/BocatomaDashboard")}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 sm:px-4 sm:py-2 rounded text-sm sm:text-base font-medium transition-colors"
        >
          Volver al inicio
        </button>
        <button 
          onClick={cerrarSesion}
          className="bg-red-500 hover:bg-red-600 px-3 py-1 sm:px-4 sm:py-2 rounded text-sm sm:text-base font-medium transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  </header>
    
  <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
    {/* Encabezado */}
    <div className="text-center mb-6 sm:mb-8">
      <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Registro de Muestras</h2>
      <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600">Sistema de control de calidad del agua</p>
    </div>

    {/* Formulario */}
    <div className="bg-white shadow-lg rounded-xl p-6 mb-8 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Nueva Muestra</h3>
          
          {errores.formato && (
            <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700">
              <p>Todos los campos deben ser números válidos.</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label htmlFor="turbiedad" className="block text-sm font-medium text-gray-700">Turbiedad (NTU)</label>
              <input
                type="number"
                step="0.1"
                id="turbiedad"
                placeholder="Ej: 1.5"
                value={turbiedad}
                onChange={(e) => setTurbiedad(e.target.value)}
                className={`w-full px-4 py-2 border ${errores.turbiedad ? 'border-red-500 bg-red-50' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition`}
              />
              <p className={`text-xs ${errores.turbiedad ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                Máximo permitido: 2 NTU
              </p>
            </div>
            
            <div className="space-y-1">
              <label htmlFor="ph" className="block text-sm font-medium text-gray-700">pH</label>
              <input
                type="number"
                step="0.1"
                id="ph"
                placeholder="Ej: 7.2"
                value={ph}
                onChange={(e) => setPh(e.target.value)}
                className={`w-full px-4 py-2 border ${errores.ph ? 'border-red-500 bg-red-50' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition`}
              />
              <p className={`text-xs ${errores.ph ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                Rango permitido: 6.5 - 9
              </p>
            </div>
            
            <div className="space-y-1">
              <label htmlFor="cloro" className="block text-sm font-medium text-gray-700">Cloro (mg/L)</label>
              <input
                type="number"
                step="0.1"
                id="cloro"
                placeholder="Ej: 1.2"
                value={cloro}
                onChange={(e) => setCloro(e.target.value)}
                className={`w-full px-4 py-2 border ${errores.cloro ? 'border-red-500 bg-red-50' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition`}
              />
              <p className={`text-xs ${errores.cloro ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                Rango permitido: 0.3 - 2.0 mg/L
              </p>
            </div>
            
            <div className="space-y-1">
              <label htmlFor="color" className="block text-sm font-medium text-gray-700">Color (UC)</label>
              <input
                type="number"
                step="1"
                id="color"
                placeholder="Ej: 10"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className={`w-full px-4 py-2 border ${errores.color ? 'border-red-500 bg-red-50' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition`}
              />
              <p className={`text-xs ${errores.color ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                Máximo permitido: 15 UC
              </p>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={guardarDatos}
              className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors shadow-md"
            >
              Guardar Muestra
            </button>
          </div>
        </div>

    {/* Tabla de muestras responsive */}
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <h3 className="px-4 py-3 sm:px-6 sm:py-4 text-base sm:text-lg font-medium text-gray-900 border-b border-gray-200">
        Historial de Muestras
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Turbiedad</th>
              <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">pH</th>
              <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Cloro</th>
              <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Color</th>
              <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Hora</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {muestras.map((muestra, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">{muestra.Turbiedad}</td>
                <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">{muestra.Ph}</td>
                <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">{muestra.Cloro}</td>
                <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">{muestra.Color}</td>
                <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">{muestra.Fecha}</td>
                <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">{muestra.Hora}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
  );}
export default BocMuestras;
