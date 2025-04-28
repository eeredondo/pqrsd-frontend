import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  UserPlus, ShieldCheck, Loader, Users,
  Edit2, Save, Search, PlusCircle, KeyRound,
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
  const token = localStorage.getItem("token");

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
    setUsuarioEditando({
      ...usuario,
      contraseña: "",
    });
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
          onChange={(e) => setBusqueda(e.target.value)}
          className="border rounded p-2 w-full sm:max-w-xs"
        />
      </div>

      {/* Tabla */}
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
              {usuariosFiltrados.map((u) => (
                <tr key={u.id} className="hover:bg-blue-50">
                  <td className="px-4 py-3">{u.usuario}</td>

                  {/* Nombre */}
                  <td className="px-4 py-3">
                    {modoEdicion === u.id ? (
                      <input
                        value={usuarioEditando.nombre}
                        onChange={(e) => setUsuarioEditando({...usuarioEditando, nombre: e.target.value})}
                        className="border rounded p-1 w-full"
                      />
                    ) : (
                      u.nombre
                    )}
                  </td>

                  {/* Correo */}
                  <td className="px-4 py-3">
                    {modoEdicion === u.id ? (
                      <input
                        value={usuarioEditando.correo}
                        onChange={(e) => setUsuarioEditando({...usuarioEditando, correo: e.target.value})}
                        className="border rounded p-1 w-full"
                      />
                    ) : (
                      u.correo
                    )}
                  </td>

                  {/* Rol */}
                  <td className="px-4 py-3 capitalize">
                    {modoEdicion === u.id ? (
                      <select
                        value={usuarioEditando.rol}
                        onChange={(e) => setUsuarioEditando({...usuarioEditando, rol: e.target.value})}
                        className="border rounded p-1 w-full"
                      >
                        {rolesDisponibles.map((rol) => (
                          <option key={rol} value={rol}>
                            {rol.charAt(0).toUpperCase() + rol.slice(1)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className={`px-2 py-1 rounded-full text-xs ${rolColor[u.rol]}`}>
                        {u.rol}
                      </span>
                    )}
                  </td>

                  {/* Acciones */}
                  <td className="px-4 py-3 text-center flex gap-2 flex-wrap justify-center">
                    {modoEdicion === u.id ? (
                      <>
                        <input
                          type="password"
                          placeholder="Nueva contraseña (opcional)"
                          value={usuarioEditando.contraseña}
                          onChange={(e) => setUsuarioEditando({...usuarioEditando, contraseña: e.target.value})}
                          className="border rounded p-1 w-full"
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
                          <KeyRound size={16} /> Cambiar Contraseña
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

      {/* Modal Crear Usuario */}
      {mostrarModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
            <h2 className="text-xl font-bold mb-6">Crear nuevo usuario</h2>
            <div className="flex flex-col gap-4">
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
              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setMostrarModal(false)}
                  className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={crearUsuario}
                  className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                >
                  {loading ? <Loader size={16} className="animate-spin" /> : <UserPlus size={16} />}
                  Crear
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Resetear Contraseña */}
      {mostrarModalReset && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-sm">
            <h2 className="text-xl font-bold mb-6">Cambiar Contraseña</h2>
            <p className="mb-4 text-sm text-gray-600">Usuario: {usuarioReset?.usuario}</p>
            <input
              type="password"
              placeholder="Nueva contraseña"
              value={nuevaContraseña}
              onChange={(e) => setNuevaContraseña(e.target.value)}
              className="border rounded p-2 w-full mb-6"
            />
            <div className="flex justify-between">
              <button
                onClick={() => setMostrarModalReset(false)}
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarResetearContraseña}
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
              >
                Cambiar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PanelAdmin;
