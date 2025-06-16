import React, { useState, useEffect } from "react";
import app from "../FirebaseConfiguration";
import { getDatabase, ref, set, push, onValue } from "firebase/database";
import { useNavigate } from "react-router-dom";

function OperarioMuestras() {
  const [turbiedad, setTurbiedad] = useState("");
  const [ph, setPh] = useState("");
  const [color, setColor] = useState("");
  const [cloro, setCloro] = useState("");
  const [muestras, setMuestras] = useState([]);
  const navigate = useNavigate();
  const nombreUsuario = localStorage.getItem("nombreUsuario") || "Desconocido";

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
          onClick={() => navigate("/OperarioDashboard")}
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
    <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Turbiedad</label>
          <input
            type="text"
            placeholder="NTU"
            value={turbiedad}
            onChange={(e) => setTurbiedad(e.target.value)}
            className="w-full px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">pH</label>
          <input
            type="text"
            placeholder="0-14"
            value={ph}
            onChange={(e) => setPh(e.target.value)}
            className="w-full px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Cloro</label>
          <input
            type="text"
            placeholder="mg/L"
            value={cloro}
            onChange={(e) => setCloro(e.target.value)}
            className="w-full px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Color</label>
          <input
            type="text"
            placeholder="UC"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full px-3 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      
      <div className="mt-4 sm:mt-6 flex justify-center">
        <button
          onClick={guardarDatos}
          className="px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 text-white text-sm sm:text-base font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          Guardar Datos
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
export default OperarioMuestras;
