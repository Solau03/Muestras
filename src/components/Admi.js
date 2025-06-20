import { useEffect, useState } from "react";
import { getDatabase, ref, get, child, remove } from "firebase/database";
import app from "../FirebaseConfiguration";
import FormularioRegistroUsuario from "../components/Registro";

export default function AdminDashboard() {
  const [usuarios, setUsuarios] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false); // Nuevo estado para controlar el menú

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
    <div className="flex min-h-screen bg-gray-100">
      {/* Overlay para móviles cuando el menú está abierto */}
      {menuAbierto && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setMenuAbierto(false)}
        ></div>
      )}

      {/* Sidebar - Ahora con animación y control de visibilidad */}
      <aside className={`fixed md:relative z-30 md:z-0 w-64 bg-white shadow-md p-4 transform transition-transform duration-300 ease-in-out ${
        menuAbierto ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <h2 className="text-2xl font-bold text-blue-600 mb-6">Admin</h2>
        <nav className="space-y-4">
          <a href="/Admi" className="block text-gray-700 hover:text-blue-600">Usuarios</a>
          <a href="/Muestras" className="block text-gray-700 hover:text-blue-600">Muestras Calidad</a>
          <a href="/Muestrasreportes" className="block text-gray-700 hover:text-blue-600">Reportes calidad</a>
          <a href="/AdmiOrden" className="block text-gray-700 hover:text-blue-600">Ordenes Reparación</a>
          <a href="/Macros" className="block text-gray-700 hover:text-red-500">Lecturas Macro</a>
          <a href="/ReporteMacros" className="block text-gray-700 hover:text-red-500">Reportes Macro</a>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-8 relative">
        {/* Mobile menu button - Ahora con funcionalidad */}
        <button 
          className="md:hidden fixed top-4 left-4 z-40 bg-blue-600 text-white p-2 rounded-full shadow-lg"
          onClick={() => setMenuAbierto(!menuAbierto)}
        >
          {menuAbierto ? '✕' : '☰'}
        </button>

        <div className="flex flex-col md:flex-row justify-between items-center mb-6 mt-12 md:mt-0">
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-800 mb-4 md:mb-0">Usuarios Registrados</h1>
          <button
            onClick={() => setMostrarModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full flex items-center shadow w-full md:w-auto justify-center"
          >
            <span className="text-xl mr-2">➕</span> Agregar Usuario
          </button>
        </div>

        {/* Resto del código permanece igual */}
        <div className="bg-white rounded-xl shadow p-4 md:p-6 overflow-auto">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-auto text-sm text-left text-gray-700">
                <thead className="bg-blue-100">
                  <tr>
                    <th className="p-3">Nombre</th>
                    <th className="p-3">Rol</th>
                    <th className="p-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.length > 0 ? (
                    usuarios.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-blue-50">
                        <td className="p-3">{user.nombreUsuario}</td>
                        <td className="p-3 capitalize">{user.tipoUsuario || "usuario"}</td>
                        <td className="p-3">
                          <button
                            onClick={() => setUsuarioAEliminar(user)}
                            className="text-red-500 hover:text-red-700 p-1"
                            title="Eliminar usuario"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="p-4 text-center text-gray-400">
                        No hay usuarios registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modales permanecen igual */}
        {usuarioAEliminar && (
          <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold mb-4">Confirmar eliminación</h3>
              <p className="mb-4">¿Estás seguro de eliminar al usuario <strong>{usuarioAEliminar.nombreUsuario}</strong>?</p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setUsuarioAEliminar(null)}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => eliminarUsuario(usuarioAEliminar.id)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {mostrarModal && (
          <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50 p-4">
            <div className="bg-white rounded-xl shadow-lg p-6 relative max-w-md w-full">
              <button
                onClick={() => setMostrarModal(false)}
                className="absolute top-2 right-3 text-gray-500 hover:text-red-500 text-lg"
              >
                ✕
              </button>
              <FormularioRegistroUsuario
                onClose={() => setMostrarModal(false)}
                onUsuarioCreado={fetchUsuarios}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}