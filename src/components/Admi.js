import { useEffect, useState } from "react";
import { getDatabase, ref, get, child, remove } from "firebase/database";
import app from "../FirebaseConfiguration";
import FormularioRegistroUsuario from "../components/Registro";

export default function AdminDashboard() {
  const [usuarios, setUsuarios] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);

  const fetchUsuarios = async () => {
    setLoading(true);
    const db = getDatabase(app);
    const dbRef = ref(db);
    try {
      const snapshot = await get(child(dbRef, "usuarios/usuarios"));
      if (snapshot.exists()) {
        const data = snapshot.val();
        const usuariosArray = Object.entries(data).map(([id, usuario]) => ({
          id,
          ...usuario
        }));
        setUsuarios(usuariosArray);
      } else {
        setUsuarios([]);
      }
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
    } finally {
      setLoading(false);
    }
  };

  const eliminarUsuario = async (userId) => {
    if (!window.confirm("¿Estás seguro de eliminar este usuario?")) return;
    
    try {
      const db = getDatabase(app);
      await remove(ref(db, `usuarios/usuarios/${userId}`));
      fetchUsuarios();
      setUsuarioAEliminar(null);
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

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
        {/* Encabezado mejorado */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 mt-12 md:mt-0">
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-800">Usuarios Registrados</h1>
          <button
            onClick={() => setMostrarModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg shadow-md transition-all duration-200 w-full md:w-auto flex items-center justify-center"
          >
            <span className="text-xl mr-2">+</span> 
            <span>Agregar Usuario</span>
          </button>
        </div>

        {/* Tabla de usuarios - versión responsive */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : usuarios.length > 0 ? (
            <>
              {/* Versión desktop (tabla normal) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-gray-700">
                  <thead className="bg-blue-600 text-white">
                    <tr>
                      <th className="p-4 font-medium rounded-tl-lg">Nombre</th>
                      <th className="p-4 font-medium">Rol</th>
                      <th className="p-4 font-medium rounded-tr-lg">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {usuarios.map((user) => (
                      <tr key={user.id} className="hover:bg-blue-50 transition-colors">
                        <td className="p-4 font-medium">{user.nombreUsuario}</td>
                        <td className="p-4 capitalize">{user.tipoUsuario || "usuario"}</td>
                        <td className="p-4">
                          <button
                            onClick={() => setUsuarioAEliminar(user)}
                            className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-md transition-colors duration-200 flex items-center"
                          >
                            <span className="mr-1">Eliminar</span>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Versión móvil (cards) */}
              <div className="md:hidden space-y-4 p-4">
                {usuarios.map((user) => (
                  <div key={user.id} className="border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-800">{user.nombreUsuario}</h3>
                        <p className="text-sm text-gray-500 capitalize">{user.tipoUsuario || "usuario"}</p>
                      </div>
                      <button
                        onClick={() => setUsuarioAEliminar(user)}
                        className="text-red-600 p-2 rounded-full hover:bg-red-50"
                        title="Eliminar"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">No hay usuarios</h3>
              <p className="mt-1 text-sm text-gray-500">No se encontraron usuarios registrados.</p>
              <div className="mt-6">
                <button
                  onClick={() => setMostrarModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Agregar Usuario
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal de confirmación para eliminar - Mejorado responsive */}
        {usuarioAEliminar && (
          <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Confirmar eliminación</h3>
              <p className="mb-6 text-gray-600">
                ¿Estás seguro de eliminar al usuario <strong>{usuarioAEliminar.nombreUsuario}</strong>? 
                Esta acción no se puede deshacer.
              </p>
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button
                  onClick={() => setUsuarioAEliminar(null)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors w-full sm:w-auto"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => eliminarUsuario(usuarioAEliminar.id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center w-full sm:w-auto"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal para agregar usuario - Mejorado responsive */}
        {mostrarModal && (
          <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-lg p-6 relative w-full max-w-md max-h-[90vh] overflow-y-auto mx-4">
              <button
                onClick={() => setMostrarModal(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-red-500 text-xl"
              >
                ×
              </button>
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Agregar Nuevo Usuario</h3>
              <FormularioRegistroUsuario
                onClose={() => setMostrarModal(false)}
                onUsuarioCreado={fetchUsuarios}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  </div>
);
}