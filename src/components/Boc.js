import React from "react";
import { useNavigate } from "react-router-dom";

export default function BocDashboard() {
  const navigate = useNavigate();
  
  // Obtener datos del usuario desde localStorage
  const nombreUsuario = localStorage.getItem("nombreUsuario");

  const cerrarSesion = () => {
    // Limpiar localStorage y redirigir al login
    localStorage.removeItem("nombreUsuario");
    localStorage.removeItem("tipoUsuario");
    navigate("/log");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white-100 to-white-100">
  {/* Header Responsive */}
  <header className="bg-blue-400 text-white p-3 sm:p-4 shadow-md flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-0">
    <div className="text-center sm:text-left">
      <h1 className="text-xl sm:text-2xl font-bold">Bienvenido</h1>
      <p className="text-xs sm:text-sm">👤 {nombreUsuario}</p>
    </div>
    <div className="flex gap-2">
      
      <button 
        onClick={cerrarSesion}
        className="bg-red-500 hover:bg-red-600 px-3 py-1 sm:px-4 sm:py-2 rounded text-sm sm:text-base transition-colors"
      >
        Cerrar sesión
      </button>
    </div>
  </header>

  {/* Responsive Content */}
  <main className="p-4 sm:p-6">
    <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Acciones disponibles:</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
      <button 
        onClick={() => navigate("/BocMuestra")}
        className="bg-white border-2 border-indigo-400 hover:bg-blue-50 text-gray-800 font-bold py-2 sm:py-3 px-4 sm:px-5 rounded-xl shadow text-sm sm:text-base transition-colors"
      >
        Registrar Muestra Caudal
      </button>
      <button 
        onClick={() => navigate("/BocMacro")}
        className="bg-white border-2 border-green-600 hover:bg-green-50 text-gray-800 font-bold py-2 sm:py-3 px-4 sm:px-5 rounded-xl shadow text-sm sm:text-base transition-colors"
      >
        Registrar Lectura Macro
      </button>
      <button 
        onClick={() => navigate("/BocTanque")}
        className="bg-white border-2 border-indigo-400 hover:bg-blue-50 text-gray-800 font-bold py-2 sm:py-3 px-4 sm:px-5 rounded-xl shadow text-sm sm:text-base transition-colors"
      >
        Registrar Nivel de Tanque
      </button>
      <button 
        onClick={() => navigate("/BocOrdenes")}
        className="bg-white border-2 border-green-600 hover:bg-green-50 text-gray-800 font-bold py-2 sm:py-3 px-4 sm:px-5 rounded-xl shadow text-sm sm:text-base transition-colors"
      >
        Reparaciones
      </button>
      <button 
        onClick={() => navigate("/Bocatoma")}
        className="bg-white border-2 border-indigo-400 hover:bg-blue-50 text-gray-800 font-bold py-2 sm:py-3 px-4 sm:px-5 rounded-xl shadow text-sm sm:text-base transition-colors"
      
      >
        Bocatoma
      </button>
      <button 
        onClick={() => navigate("/Manzano")}
        className="bg-white border-2 border-green-600 hover:bg-green-50 text-gray-800 font-bold py-2 sm:py-3 px-4 sm:px-5 rounded-xl shadow text-sm sm:text-base transition-colors"
      >
        Manzano
      </button>
    </div>
  </main>
</div>
  );
}