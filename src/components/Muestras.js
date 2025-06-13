import React, { useState, useEffect } from "react";
import app from "../FirebaseConfiguration";
import { getDatabase, ref, set, push, onValue } from "firebase/database";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

function Muestras() {
  const [turbiedad, setTurbiedad] = useState("");
  const [ph, setPh] = useState("");
  const [color, setColor] = useState("");
  const [cloro, setCloro] = useState("");
  const [muestras, setMuestras] = useState([]);

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
    const hora = new Date().toLocaleTimeString(); 

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

  // Función para exportar a Excel
  const exportToExcel = () => {
    // Preparar los datos para exportar
    const dataToExport = muestras.map(muestra => ({
      "Usuario": muestra.nombreUsuario,
      "Turbiedad (NTU)": muestra.Turbiedad,
      "pH": muestra.Ph,
      "Cloro (mg/L)": muestra.Cloro,
      "Color (UC)": muestra.Color,
      "Fecha": muestra.Fecha,
      "Hora": muestra.Hora
    }));

    // Crear hoja de trabajo
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    
    // Crear libro de trabajo
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "MuestrasCalidad");
    
    // Generar archivo Excel
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    
    // Descargar archivo
    saveAs(data, `MuestrasCalidad_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-white-100 to-wihte-100">
      {/* Sidebar */}
      <aside className="w-64 bg-green shadow-md p-4">
        <h2 className="text-2xl font-bold text-blue-600 mb-6">Admin</h2>
        <nav className="space-y-4">
          <a href="/Admi" className="block text-gray-700 hover:text-blue-600">Usuarios</a>
          <a href="/Muestras" className="block text-gray-700 hover:text-blue-600">Muestras Calidad</a>
          <a href="/Muestrasreportes" className="block text-gray-700 hover:text-blue-600">Reportes calidad</a>
          <a href="/AdmiOrden" className="block text-gray-700 hover:text-blue-600">Órdenes Reparación</a>
          <a href="/Macros" className="block text-gray-700 hover:text-red-500">Lecturas Macro</a>
          <a href="/ReporteMacros" className="block text-gray-700 hover:text-red-500">Reportes Macro</a>
        </nav>
      </aside>

      {/* Contenido principal */}
      <div className="flex-1 p-8 overflow-auto">
        {/* Encabezado */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-black-800">Registro de Muestras</h2>
          <p className="mt-2 text-sm text-blue-700">Ingrese los parámetros de calidad del agua</p>
        </div>

        {/* Formulario */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="turbiedad" className="block text-sm font-medium text-gray-700 mb-1">Turbiedad</label>
              <input
                type="text"
                id="turbiedad"
                placeholder="Ej: 2.5 NTU"
                value={turbiedad}
                onChange={(e) => setTurbiedad(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="ph" className="block text-sm font-medium text-gray-700 mb-1">pH</label>
              <input
                type="text"
                id="ph"
                placeholder="Ej: 7.2"
                value={ph}
                onChange={(e) => setPh(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="cloro" className="block text-sm font-medium text-gray-700 mb-1">Cloro</label>
              <input
                type="text"
                id="cloro"
                placeholder="Ej: 1.8 mg/L"
                value={cloro}
                onChange={(e) => setCloro(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <input
                type="text"
                id="color"
                placeholder="Ej: 10 UC"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <button
              onClick={guardarDatos}
              className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Guardar Datos
            </button>
          </div>
        </div>

        {/* Tabla de muestras y botón de exportación */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-4">
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Muestras registradas</h3>
            <button
              onClick={exportToExcel}
              className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              Exportar a Excel
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Turbiedad (NTU)</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">pH</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cloro (mg/L)</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color (UC)</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {muestras.map((muestra, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{muestra.nombreUsuario}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{muestra.Turbiedad}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{muestra.Ph}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{muestra.Cloro}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{muestra.Color}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{muestra.Fecha}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{muestra.Hora}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Muestras;