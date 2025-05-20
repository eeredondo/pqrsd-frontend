import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  UserPlus, ShieldCheck, Loader, Users,
  Edit2, Save, Search, PlusCircle, KeyRound, Trash2,
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
  const [modoEdicion, setModoEdicion] = useState(null);
  const [usuarioEditando, setUsuarioEditando] = useState({});
  const [busqueda, setBusqueda] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalReset, setMostrarModalReset] = useState(false);
  const [usuarioReset, setUsuarioReset] = useState(null);
  const [nuevaContraseña, setNuevaContraseña] = useState("");
  const [pagina, setPagina] = useState(1);

  const token = localStorage.getItem("token");
  const usuariosPorPagina = 10;

  const rolesDisponibles = ["asignador", "responsable", "revisor", "firmante", "admin"];
  const rolColor = {
    asignador: "bg-blue-100 text-blue-700",
    responsable: "bg-green-100 text-green-700",
    revisor: "bg-yellow-100 text-yellow-700",
    firmante: "bg-purple-100 text-purple-700",
    admin: "bg-red-100 text-red-700",
  };

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
      setMostrarModal(false);
      obtenerUsuarios();
    } catch (err) {
      console.error("Error al crear usuario:", err);
      toast.error("❌ No se pudo crear el usuario");
    } finally {
      setLoading(false);
    }
  };

  const activarModoEdicion = (usuario) => {
    setModoEdicion(usuario.id);
    setUsuarioEditando({ ...usuario, contraseña: "" });
  };

  const guardarEdicion = async () => {
    try {
      const payload = {
        nombre: usuarioEditando.nombre,
        correo: usuarioEditando.correo,
        rol: usuarioEditando.rol,
      };
      if (usuarioEditando.contraseña) {
        payload.contraseña = usuarioEditando.contraseña;
      }

      await axios.put(`${import.meta.env.VITE_API_URL}/usuarios/${modoEdicion}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("✅ Usuario actualizado");
      setModoEdicion(null);
      setUsuarioEditando({});
      obtenerUsuarios();
    } catch (err) {
      console.error("Error al actualizar usuario:", err);
      toast.error("❌ No se pudo actualizar el usuario");
    }
  };

  const abrirModalReset = (usuario) => {
    setUsuarioReset(usuario);
    setNuevaContraseña("");
    setMostrarModalReset(true);
  };

  const confirmarResetearContraseña = async () => {
    if (!nuevaContraseña) {
      toast.warn("⚠️ Debes escribir una nueva contraseña.");
      return;
    }
    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/usuarios/${usuarioReset.id}/reset-password`, {
        nueva_contraseña: nuevaContraseña,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("✅ Contraseña actualizada correctamente");
      setMostrarModalReset(false);
      obtenerUsuarios();
    } catch (err) {
      console.error("Error al resetear contraseña:", err);
      toast.error("❌ No se pudo resetear la contraseña");
    }
  };

  const eliminarUsuario = async (id) => {
    if (!confirm("¿Estás seguro de eliminar este usuario?")) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/usuarios/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("✅ Usuario eliminado correctamente");
      obtenerUsuarios();
    } catch (err) {
      console.error("Error al eliminar usuario:", err);
      toast.error("❌ No se pudo eliminar el usuario");
    }
  };

  const usuariosFiltrados = usuarios.filter(u =>
    u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.usuario.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.correo.toLowerCase().includes(busqueda.toLowerCase())
  );

  const totalPaginas = Math.ceil(usuariosFiltrados.length / usuariosPorPagina);
  const usuariosPaginados = usuariosFiltrados.slice(
    (pagina - 1) * usuariosPorPagina,
    pagina * usuariosPorPagina
  );

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-blue-800 mb-6 flex items-center gap-2">
        <ShieldCheck size={24} /> Panel de Administración
      </h2>

      {/* Botón de crear */}
      <div className="flex justify-between mb-6 flex-wrap gap-4">
        <button
          onClick={() => setMostrarModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <PlusCircle size={18} /> Crear Nuevo Usuario
        </button>
      </div>

      {/* Búsqueda */}
      <div className="mb-6 flex items-center gap-2">
        <Search className="text-gray-600" />
        <input
          type="text"
          placeholder="Buscar usuarios..."
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value);
            setPagina(1); // reinicia página al buscar
          }}
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
                <th className="px-4 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {usuariosPaginados.map((u) => (
                <tr key={u.id} className="hover:bg-blue-50">
                  <td className="px-4 py-3">{u.usuario}</td>
                  <td className="px-4 py-3">
                    {modoEdicion === u.id ? (
                      <input
                        value={usuarioEditando.nombre}
                        onChange={(e) => setUsuarioEditando({...usuarioEditando, nombre: e.target.value})}
                        className="border rounded p-1 w-full"
                      />
                    ) : u.nombre}
                  </td>
                  <td className="px-4 py-3">
                    {modoEdicion === u.id ? (
                      <input
                        value={usuarioEditando.correo}
                        onChange={(e) => setUsuarioEditando({...usuarioEditando, correo: e.target.value})}
                        className="border rounded p-1 w-full"
                      />
                    ) : u.correo}
                  </td>
                  <td className="px-4 py-3 capitalize">
                    {modoEdicion === u.id ? (
                      <select
                        value={usuarioEditando.rol}
                        onChange={(e) => setUsuarioEditando({...usuarioEditando, rol: e.target.value})}
                        className="border rounded p-1 w-full"
                      >
                        {rolesDisponibles.map((rol) => (
                          <option key={rol} value={rol}>{rol}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`px-2 py-1 rounded-full text-xs ${rolColor[u.rol]}`}>{u.rol}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center flex flex-wrap gap-2 justify-center">
                    {modoEdicion === u.id ? (
                      <>
                        <input
                          type="password"
                          placeholder="Nueva contraseña (opcional)"
                          value={usuarioEditando.contraseña}
                          onChange={(e) => setUsuarioEditando({...usuarioEditando, contraseña: e.target.value})}
                          className="border rounded p-1 w-full"
                        />
                        <button onClick={guardarEdicion} className="text-green-600 hover:text-green-800 flex items-center gap-1">
                          <Save size={16} /> Guardar
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => activarModoEdicion(u)} className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
                          <Edit2 size={16} /> Editar
                        </button>
                        <button onClick={() => abrirModalReset(u)} className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                          <KeyRound size={16} /> Contraseña
                        </button>
                        <button onClick={() => eliminarUsuario(u.id)} className="text-red-600 hover:text-red-800 flex items-center gap-1">
                          <Trash2 size={16} /> Eliminar
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="flex justify-center items-center mt-4 gap-3">
            <button
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={pagina === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              ← Anterior
            </button>
            <span>Página {pagina} de {totalPaginas}</span>
            <button
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={pagina === totalPaginas}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>

      {/* Aquí permanecen los modales de creación y cambio de contraseña que ya tienes */}
    </div>
  );
}

export default PanelAdmin;
