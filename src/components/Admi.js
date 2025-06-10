import { useEffect, useState } from "react";
import { getDatabase, ref, get, child } from "firebase/database";
import app from "../FirebaseConfiguration";
import FormularioRegistroUsuario from "../components/Registro";

export default function AdminDashboard() {
  const [usuarios, setUsuarios] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);

  const fetchUsuarios = async () => {
    const db = getDatabase(app);
    const dbRef = ref(db);
    try {
      const snapshot = await get(child(dbRef, "usuarios/usuarios"));
      if (snapshot.exists()) {
        const data = snapshot.val();
        setUsuarios(Object.values(data));
      }
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
    }
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md p-4">
        <h2 className="text-2xl font-bold text-blue-600 mb-6">Admin</h2>
        <nav className="space-y-4">
          <a href="#" className="block text-gray-700 hover:text-blue-600">📊 Dashboard</a>
          <a href="#" className="block text-gray-700 hover:text-blue-600">👥 Usuarios</a>
          <a href="#" className="block text-gray-700 hover:text-blue-600">⚙️ Configuración</a>
          <a href="#" className="block text-gray-700 hover:text-red-500">🚪 Cerrar sesión</a>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 relative">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-semibold text-gray-800">Usuarios Registrados</h1>
          <button
            onClick={() => setMostrarModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full flex items-center shadow"
          >
            <span className="text-xl mr-2">➕</span> Agregar Usuario
          </button>
        </div>

        <div className="bg-white rounded-xl shadow p-6 overflow-auto">
          <table className="w-full table-auto text-sm text-left text-gray-700">
            <thead className="bg-blue-100">
              <tr>
                <th className="p-3">Nombre</th>
                <th className="p-3">Rol</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.length > 0 ? (
                usuarios.map((user, index) => (
                  <tr key={index} className="border-b hover:bg-blue-50">
                    <td className="p-3">{user.nombreUsuario}</td>
                    <td className="p-3">{user.tipoUsuario || "usuario"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="p-4 text-center text-gray-400">
                    No hay usuarios registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {mostrarModal && (
          <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 relative">
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
