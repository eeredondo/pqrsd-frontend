import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  UserPlus, ShieldCheck, Loader, Users,
  Edit2, Save, Search, PlusCircle, KeyRound, Trash2
} from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function PanelAdmin() {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("todos");
  const [nuevo, setNuevo] = useState({ usuario: "", nombre: "", correo: "", contraseña: "", rol: "asignador" });
  const [modoEdicion, setModoEdicion] = useState(null);
  const [usuarioEditando, setUsuarioEditando] = useState({});
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalReset, setMostrarModalReset] = useState(false);
  const [usuarioReset, setUsuarioReset] = useState(null);
  const [nuevaContraseña, setNuevaContraseña] = useState("");
  const [loading, setLoading] = useState(false);
  const [pagina, setPagina] = useState(1);

  const token = localStorage.getItem("token");
  const usuariosPorPagina = 10;
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
      toast.success("✅ Usuario creado");
      setNuevo({ usuario: "", nombre: "", correo: "", contraseña: "", rol: "asignador" });
      setMostrarModal(false);
      obtenerUsuarios();
    } catch (err) {
      console.error(err);
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
      toast.warn("⚠️ Ingresa la nueva contraseña");
      return;
    }

    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/usuarios/${usuarioReset.id}/reset-password`, {
        nueva_contraseña: nuevaContraseña,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("✅ Contraseña actualizada");
      setMostrarModalReset(false);
    } catch (err) {
      toast.error("❌ No se pudo cambiar la contraseña");
    }
  };

  const eliminarUsuario = async (id) => {
    const confirmar = confirm("¿Estás seguro de eliminar este usuario?");
    if (!confirmar) return;

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/usuarios/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("🗑 Usuario eliminado");
      obtenerUsuarios();
    } catch (err) {
      toast.error("❌ No se pudo eliminar el usuario");
    }
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    const coincideBusqueda =
      u.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.usuario.toLowerCase().includes(busqueda.toLowerCase()) ||
      u.correo.toLowerCase().includes(busqueda.toLowerCase());

    const coincideRol = filtroRol === "todos" || u.rol === filtroRol;
    return coincideBusqueda && coincideRol;
  });

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

      {/* Controles superiores */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex gap-2 items-center">
          <Search className="text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por nombre, usuario o correo"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPagina(1);
            }}
            className="border rounded p-2 w-full max-w-xs"
          />
          <select
            value={filtroRol}
            onChange={(e) => {
              setFiltroRol(e.target.value);
              setPagina(1);
            }}
            className="border rounded p-2"
          >
            <option value="todos">Todos los roles</option>
            {rolesDisponibles.map((rol) => (
              <option key={rol} value={rol}>
                {rol.charAt(0).toUpperCase() + rol.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setMostrarModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <PlusCircle size={18} /> Crear Usuario
        </button>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto border rounded shadow bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-blue-800 text-white text-left">
            <tr>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Correo</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {usuariosPaginados.map((u) => (
              <tr key={u.id} className="hover:bg-blue-50">
                <td className="px-4 py-3">{u.usuario}</td>
                <td className="px-4 py-3">
                  {modoEdicion === u.id ? (
                    <input
                      value={usuarioEditando.nombre}
                      onChange={(e) => setUsuarioEditando({ ...usuarioEditando, nombre: e.target.value })}
                      className="border rounded p-1 w-full"
                    />
                  ) : (
                    u.nombre
                  )}
                </td>
                <td className="px-4 py-3">
                  {modoEdicion === u.id ? (
                    <input
                      value={usuarioEditando.correo}
                      onChange={(e) => setUsuarioEditando({ ...usuarioEditando, correo: e.target.value })}
                      className="border rounded p-1 w-full"
                    />
                  ) : (
                    u.correo
                  )}
                </td>
                <td className="px-4 py-3 capitalize">{u.rol}</td>
                <td className="px-4 py-3 text-center flex flex-wrap gap-2 justify-center">
                  {modoEdicion === u.id ? (
                    <>
                      <input
                        type="password"
                        placeholder="Nueva contraseña (opcional)"
                        value={usuarioEditando.contraseña}
                        onChange={(e) => setUsuarioEditando({ ...usuarioEditando, contraseña: e.target.value })}
                        className="border rounded p-1"
                      />
                      <button
                        onClick={guardarEdicion}
                        className="text-green-600 hover:text-green-800 flex items-center gap-1"
                      >
                        <Save size={16} /> Guardar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => activarModoEdicion(u)}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <Edit2 size={16} /> Editar
                      </button>
                      <button
                        onClick={() => abrirModalReset(u)}
                        className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                      >
                        <KeyRound size={16} /> Contraseña
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
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex justify-center mt-4 gap-3">
          <button
            onClick={() => setPagina(Math.max(1, pagina - 1))}
            className="px-3 py-1 border rounded disabled:opacity-50"
            disabled={pagina === 1}
          >
            ← Anterior
          </button>
          <span className="px-2 py-1">Página {pagina} de {totalPaginas}</span>
          <button
            onClick={() => setPagina(Math.min(totalPaginas, pagina + 1))}
            className="px-3 py-1 border rounded disabled:opacity-50"
            disabled={pagina === totalPaginas}
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}

export default PanelAdmin;
