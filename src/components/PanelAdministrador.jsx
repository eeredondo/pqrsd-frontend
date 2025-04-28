import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  UserPlus,
  Trash2,
  ShieldCheck,
  Loader,
  Users,
  Edit2,
  Save,
  Search
} from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function PanelAdmin() {
  const [usuarios, setUsuarios] = useState([]);
  const [nuevo, setNuevo] = useState({
    usuario: "",
    nombre: "",
    correo: "",
    contraseña: "",
    rol: "asignador",
  });
  const [loading, setLoading] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(null); // 👈 para saber qué usuario estoy editando
  const [busqueda, setBusqueda] = useState(""); // 👈 texto de búsqueda
  const token = localStorage.getItem("token");

  const rolesDisponibles = ["asignador", "responsable", "revisor", "firmante", "admin"];

  const obtenerUsuarios = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/usuarios`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsuarios(res.data);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
    }
  };

  useEffect(() => {
    obtenerUsuarios();
  }, []);

  const crearUsuario = async () => {
    if (!nuevo.usuario || !nuevo.nombre || !nuevo.correo || !nuevo.contraseña) {
      toast.warn("⚠️ Todos los campos son obligatorios.");
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${import.meta.env.VITE_API_URL}/usuarios`, nuevo, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("✅ Usuario creado exitosamente");
      setNuevo({ usuario: "", nombre: "", correo: "", contraseña: "", rol: "asignador" });
      obtenerUsuarios();
    } catch (err) {
      console.error("Error al crear usuario:", err);
      toast.error("❌ No se pudo crear el usuario");
    } finally {
      setLoading(false);
    }
  };

  const eliminarUsuario = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este usuario?")) return;

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/usuarios/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("✅ Usuario eliminado");
      obtenerUsuarios();
    } catch (err) {
      console.error("Error al eliminar usuario:", err);
      toast.error("❌ No se pudo eliminar el usuario");
    }
  };

  const guardarEdicion = async (usuarioEditado) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/usuarios/${usuarioEditado.id}`, usuarioEditado, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("✅ Usuario actualizado");
      setModoEdicion(null);
      obtenerUsuarios();
    } catch (err) {
      console.error("Error al actualizar usuario:", err);
      toast.error("❌ No se pudo actualizar el usuario");
    }
  };

  const usuariosFiltrados = usuarios.filter(u =>
    u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.usuario.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.correo.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-blue-800 mb-6 flex items-center gap-2">
        <ShieldCheck size={24} /> Panel de Administración
      </h2>

      {/* Crear nuevo usuario */}
      <div className="bg-white border p-6 rounded shadow mb-10">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <UserPlus size={18} /> Crear nuevo usuario
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <input
            type="text"
            placeholder="Usuario"
            value={nuevo.usuario}
            onChange={(e) => setNuevo({ ...nuevo, usuario: e.target.value })}
            className="border rounded p-2 w-full"
          />
          <input
            type="text"
            placeholder="Nombre completo"
            value={nuevo.nombre}
            onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
            className="border rounded p-2 w-full"
          />
          <input
            type="email"
            placeholder="Correo electrónico"
            value={nuevo.correo}
            onChange={(e) => setNuevo({ ...nuevo, correo: e.target.value })}
            className="border rounded p-2 w-full"
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={nuevo.contraseña}
            onChange={(e) => setNuevo({ ...nuevo, contraseña: e.target.value })}
            className="border rounded p-2 w-full"
          />
          <select
            value={nuevo.rol}
            onChange={(e) => setNuevo({ ...nuevo, rol: e.target.value })}
            className="border rounded p-2 w-full"
          >
            {rolesDisponibles.map((rol) => (
              <option key={rol} value={rol}>
                {rol.charAt(0).toUpperCase() + rol.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={crearUsuario}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
        >
          {loading ? <Loader size={16} className="animate-spin" /> : <UserPlus size={16} />}
          Crear Usuario
        </button>
      </div>

      {/* Buscar usuario */}
      <div className="mb-6 flex items-center gap-2">
        <Search className="text-gray-600" />
        <input
          type="text"
          placeholder="Buscar usuarios..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="border rounded p-2 w-full sm:max-w-xs"
        />
      </div>

      {/* Tabla de usuarios */}
      <div className="bg-white border p-6 rounded shadow">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Users size={20} /> Usuarios registrados
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border border-gray-200 rounded">
            <thead className="bg-blue-800 text-white">
              <tr>
                <th className="px-4 py-3 text-left">Usuario</th>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Correo</th>
                <th className="px-4 py-3 text-left">Rol</th>
                <th className="px-4 py-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {usuariosFiltrados.map((u) => (
                <tr key={u.id} className="hover:bg-blue-50">
                  <td className="px-4 py-3">
                    {modoEdicion === u.id ? (
                      <input
                        value={u.usuario}
                        disabled
                        className="border rounded p-1 w-full bg-gray-100"
                      />
                    ) : (
                      u.usuario
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {modoEdicion === u.id ? (
                      <input
                        value={u.nombre}
                        onChange={(e) =>
                          setUsuarios(usuarios.map((x) => x.id === u.id ? { ...x, nombre: e.target.value } : x))
                        }
                        className="border rounded p-1 w-full"
                      />
                    ) : (
                      u.nombre
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {modoEdicion === u.id ? (
                      <input
                        value={u.correo}
                        onChange={(e) =>
                          setUsuarios(usuarios.map((x) => x.id === u.id ? { ...x, correo: e.target.value } : x))
                        }
                        className="border rounded p-1 w-full"
                      />
                    ) : (
                      u.correo
                    )}
                  </td>
                  <td className="px-4 py-3 capitalize">
                    {modoEdicion === u.id ? (
                      <select
                        value={u.rol}
                        onChange={(e) =>
                          setUsuarios(usuarios.map((x) => x.id === u.id ? { ...x, rol: e.target.value } : x))
                        }
                        className="border rounded p-1 w-full"
                      >
                        {rolesDisponibles.map((rol) => (
                          <option key={rol} value={rol}>
                            {rol.charAt(0).toUpperCase() + rol.slice(1)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      u.rol
                    )}
                  </td>
                  <td className="px-4 py-3 text-center flex gap-2 justify-center">
                    {modoEdicion === u.id ? (
                      <button
                        onClick={() => guardarEdicion(u)}
                        className="text-green-600 hover:text-green-800 flex items-center gap-1"
                      >
                        <Save size={16} /> Guardar
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => setModoEdicion(u.id)}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        >
                          <Edit2 size={16} /> Editar
                        </button>
                        <button
                          onClick={() => eliminarUsuario(u.id)}
                          className="text-red-600 hover:text-red-800 flex items-center gap-1"
                        >
                          <Trash2 size={16} /> Eliminar
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {usuariosFiltrados.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center text-gray-500 py-4 italic">
                    No hay usuarios registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PanelAdmin;
