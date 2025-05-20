import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  UserPlus, ShieldCheck, Loader, Users,
  Edit2, Save, Search, PlusCircle, KeyRound, Trash2
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function PanelAdmin() {
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("todos");
  const [nuevo, setNuevo] = useState({ usuario: "", nombre: "", correo: "", contrasena: "", rol: "asignador" });
  const [modoEdicion, setModoEdicion] = useState(null);
  const [usuarioEditando, setUsuarioEditando] = useState({});
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalReset, setMostrarModalReset] = useState(false);
  const [usuarioReset, setUsuarioReset] = useState(null);
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [loading, setLoading] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);

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
    if (!nuevo.usuario || !nuevo.nombre || !nuevo.correo || !nuevo.contrasena) {
      toast.warn("⚠️ Todos los campos son obligatorios.");
      return;
    }

    try {
      setLoading(true);
      await axios.post(`${import.meta.env.VITE_API_URL}/usuarios`, nuevo, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("✅ Usuario creado");
      setNuevo({ usuario: "", nombre: "", correo: "", contrasena: "", rol: "asignador" });
      setMostrarModal(false);
      obtenerUsuarios();
    } catch (err) {
      toast.error("❌ No se pudo crear el usuario");
    } finally {
      setLoading(false);
    }
  };

  const activarModoEdicion = (usuario) => {
    setModoEdicion(usuario.id);
    setUsuarioEditando({ ...usuario, contrasena: "" });
  };

  const guardarEdicion = async () => {
    try {
      const payload = {
        nombre: usuarioEditando.nombre,
        correo: usuarioEditando.correo,
        rol: usuarioEditando.rol,
      };
      if (usuarioEditando.contrasena) {
        payload.contrasena = usuarioEditando.contrasena;
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
    setNuevaContrasena("");
    setMostrarModalReset(true);
  };

  const confirmarResetearContrasena = async () => {
    if (!nuevaContrasena) {
      toast.warn("⚠️ Ingresa la nueva contraseña");
      return;
    }

    try {
      await axios.put(`${import.meta.env.VITE_API_URL}/usuarios/${usuarioReset.id}/reset-password`, {
        nueva_contrasena: nuevaContrasena,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("✅ Contraseña actualizada");
      setMostrarModalReset(false);
    } catch (err) {
      toast.error("❌ No se pudo cambiar la contraseña");
    }
  };

  const confirmarEliminarUsuario = async () => {
    if (!usuarioAEliminar) return;

    try {
      toast.info("⏳ Eliminando usuario...", {
        autoClose: 1000,
        position: "top-right",
        icon: "⚙️",
        style: { background: "#e0f2fe", color: "#0369a1" },
      });

      await axios.delete(`${import.meta.env.VITE_API_URL}/usuarios/${usuarioAEliminar.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setTimeout(() => {
        toast.success("🗑️ Usuario eliminado con éxito", {
          icon: "🔥",
          position: "top-right",
          style: { background: "#dc2626", color: "#fff", fontWeight: "bold" },
        });
      }, 1000);

      setMostrarConfirmacion(false);
      setUsuarioAEliminar(null);
      obtenerUsuarios();
    } catch (err) {
      toast.error("❌ No se pudo eliminar el usuario", {
        position: "top-right",
      });
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
      <ToastContainer />

      {/* Confirmación visual de eliminación */}
      {mostrarConfirmacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md animate-fade-in">
            <h2 className="text-xl font-bold text-red-600 mb-2">⚠️ Confirmar eliminación</h2>
            <p className="text-gray-700 mb-4">
              ¿Estás seguro de que deseas eliminar al usuario <strong>{usuarioAEliminar?.nombre}</strong>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setMostrarConfirmacion(false);
                  setUsuarioAEliminar(null);
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminarUsuario}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Aquí puedes insertar la tabla, filtros, paginación y modales */}
    </div>
  );
}

export default PanelAdmin;
