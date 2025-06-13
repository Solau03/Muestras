import React, { useState, useEffect, useMemo } from "react";
import app from "../FirebaseConfiguration";
import { getDatabase, ref, push, set, onValue } from "firebase/database";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

function MacroLecturas() {
  // Estado para inputs independientes por tipo de macro
  const [lecturasInput, setLecturasInput] = useState({});
  const [mensaje, setMensaje] = useState("");
  const [lecturas, setLecturas] = useState([]);
  const [filtroMacro, setFiltroMacro] = useState("Todos");

  const db = getDatabase(app);

  // Carga inicial del historial desde Firebase
  useEffect(() => {
    const refLecturas = ref(db, "Macros/Macros");
    const unsubscribe = onValue(refLecturas, (snapshot) => {
      const data = snapshot.val();
      const lista = data ? Object.values(data) : [];
      setLecturas(lista.reverse()); // Más recientes primero
    });
    return () => unsubscribe();
  }, [db]);

  // Guarda una lectura para el tipo de macro seleccionado
  const guardarLectura = async (tipoMacro) => {
    const valor = parseFloat(lecturasInput[tipoMacro]);
    if (isNaN(valor)) {
      setMensaje("⚠️ Ingrese un número válido");
      return;
    }

    const usuario = localStorage.getItem("nombreUsuario") || "Desconocido";
    const fecha = new Date().toLocaleDateString("es-CO");
    const hora = new Date().toLocaleTimeString("es-CO");

    const nuevaLectura = { tipoMacro, lectura: valor, usuario, fecha, hora };

    try {
      const macrosRef = ref(db, "Macros/Macros");
      await set(push(macrosRef), nuevaLectura);
      setLecturasInput(prev => ({ ...prev, [tipoMacro]: "" }));
      setMensaje(`✅ Lectura guardada para ${tipoMacro}`);
    } catch (error) {
      setMensaje("❌ Error al guardar: " + error.message);
    }
  };

  // Tipos de macro disponibles
  const macros = [
    'Macro 8" - Entrada Planta',
    'Macro 6" - Salida Planta',
    'Macro 4" - Laguneta',
    'Macro 4" - General',
  ];

  // Filtrado memoizado
  const lecturasFiltradas = useMemo(() => {
    if (filtroMacro === "Todos") return lecturas;
    return lecturas.filter(l => l.tipoMacro === filtroMacro);
  }, [lecturas, filtroMacro]);

  // Función para exportar a Excel
  const exportToExcel = () => {
    // Preparar los datos para exportar
    const dataToExport = lecturasFiltradas.map(lectura => ({
      "Operario": lectura.usuario,
      "Fecha": lectura.fecha,
      "Hora": lectura.hora,
      "Tipo de Macro": lectura.tipoMacro,
      "Lectura (m³/día)": lectura.lectura
    }));

    // Crear hoja de trabajo
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    
    // Crear libro de trabajo
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "LecturasMacro");
    
    // Generar archivo Excel
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    
    // Descargar archivo
    saveAs(data, `LecturasMacro_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-white-100 to-white-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg p-6 flex-shrink-0">
        <h2 className="text-2xl font-bold text-blue-700 mb-8">Admin</h2>
        <nav className="space-y-4">
          <a href="/Muestras" className="block text-gray-700 hover:text-blue-600">Muestras Calidad</a>
          <a href="/Muestrasreportes" className="block text-gray-700 hover:text-blue-600">Reportes Calidad</a>
          <a href="/AdmiOrden" className="block text-gray-700 hover:text-blue-600">Órdenes Reparación</a>
          <a href="/Macros" className="block text-gray-700 hover:text-blue-600">Lecturas Macro</a>
          <a href="/ReporteMacros" className="block text-gray-700 hover:text-blue-600">Reportes Macro</a>
        </nav>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-3xl mx-auto bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Registro de Lecturas por Macromedidor</h2>
          </div>

          {/* Formulario por cada tipo de macro */}
          {macros.map((tipoMacro, index) => (
            <div key={index} className="mb-6 border-t pt-4">
              <h3 className="text-lg font-semibold">{tipoMacro}</h3>
              <div className="flex gap-2 mt-2">
                <input
                  type="number"
                  placeholder="Lectura m³/día"
                  value={lecturasInput[tipoMacro] || ""}
                  onChange={(e) =>
                    setLecturasInput(prev => ({ ...prev, [tipoMacro]: e.target.value }))
                  }
                  className="p-2 border rounded w-1/2"
                />
                <button
                  onClick={() => guardarLectura(tipoMacro)}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Guardar
                </button>
              </div>
            </div>
          ))}

          {mensaje && <p className="text-center text-sm mt-2">{mensaje}</p>}

          {/* Filtro y botón de exportación */}
          <div className="mt-8 mb-4 flex justify-between items-center">
            <div className="w-1/2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filtrar por Tipo de Macro:
              </label>
              <select
                value={filtroMacro}
                onChange={e => setFiltroMacro(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option>Todos</option>
                {macros.map(m => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>
            
            <button
              onClick={exportToExcel}
              className="mt-6 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Exportar a Excel
            </button>
          </div>

          {/* Tabla de historial */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Historial de Lecturas</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white shadow rounded-lg">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Operario</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Fecha</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Hora</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Tipo de Macro</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Lectura (m³/día)</th>
                </tr>
              </thead>
              <tbody>
                {lecturasFiltradas.map((l, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-2 text-sm text-gray-800">{l.usuario}</td>
                    <td className="px-4 py-2 text-sm text-gray-800">{l.fecha}</td>
                    <td className="px-4 py-2 text-sm text-gray-800">{l.hora}</td>
                    <td className="px-4 py-2 text-sm text-gray-800">{l.tipoMacro}</td>
                    <td className="px-4 py-2 text-sm text-gray-800">{l.lectura}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

export default MacroLecturas;