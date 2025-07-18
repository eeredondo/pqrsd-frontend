import React, { useEffect, useState } from "react";
import axios from "axios";
import { ArrowUpDown, FileDown } from "lucide-react";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Función para decodificar el payload del JWT sin librerías externas
function decodeJWT(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

function ConsultorPQRSD() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [rol, setRol] = useState("");
  const [filtroRadicado, setFiltroRadicado] = useState("");
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroEncargado, setFiltroEncargado] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [sugerenciasTipo, setSugerenciasTipo] = useState([]);
  const [orden, setOrden] = useState({ campo: "radicado", asc: false });
  const [paginaActual, setPaginaActual] = useState(1);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [nuevoEncargado, setNuevoEncargado] = useState("");
  const [mostrarModalReasignar, setMostrarModalReasignar] = useState(false);

  const porPagina = 10;
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    // Carga inicial
    cargarSolicitudes();
    fetchUsuarios();
    if (token) {
      const decoded = decodeJWT(token);
      setRol(decoded?.rol || "");
    }
  }, []);

  const cargarSolicitudes = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/solicitudes/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSolicitudes(res.data);
    } catch (err) {
      console.error("Error al cargar solicitudes:", err);
    }
  };

  const fetchUsuarios = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/usuarios/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsuarios(res.data);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
    }
  };

  const cambiarOrden = (campo) => {
    setOrden((prev) => ({
      campo,
      asc: prev.campo === campo ? !prev.asc : true,
    }));
  };

  const tiposExistentes = Array.from(
    new Set(solicitudes.map((s) => s.tipo_pqrsd).filter(Boolean))
  );

  const handleFiltroTipoChange = (e) => {
    const valor = e.target.value;
    setFiltroTipo(valor);
    if (valor) {
      setSugerenciasTipo(
        tiposExistentes.filter((t) =>
          t.toLowerCase().includes(valor.toLowerCase())
        )
      );
    } else {
      setSugerenciasTipo([]);
    }
  };

  const seleccionarSugerencia = (tipo) => {
    setFiltroTipo(tipo);
    setSugerenciasTipo([]);
  };

  // Filtrar y ordenar
  const filtradas = solicitudes.filter((s) => {
    const nombre = `${s.nombre} ${s.apellido}`.toLowerCase();
    const encargado = s.encargado_nombre?.toLowerCase() || "";
    const fecha = new Date(s.fecha_creacion);
    return (
      s.radicado.toLowerCase().includes(filtroRadicado.toLowerCase()) &&
      nombre.includes(filtroNombre.toLowerCase()) &&
      encargado.includes(filtroEncargado.toLowerCase()) &&
      (!filtroEstado || s.estado === filtroEstado) &&
      (!filtroTipo ||
        s.tipo_pqrsd?.toLowerCase().includes(filtroTipo.toLowerCase())) &&
      (!fechaDesde || fecha >= new Date(fechaDesde)) &&
      (!fechaHasta || fecha <= new Date(fechaHasta))
    );
  });

  const ordenadas = [...filtradas].sort((a, b) => {
    const { campo, asc } = orden;
    if (campo === "radicado") {
      return asc
        ? a.radicado.localeCompare(b.radicado)
        : b.radicado.localeCompare(a.radicado);
    }
    if (campo === "fecha") {
      return asc
        ? new Date(a.fecha_creacion) - new Date(b.fecha_creacion)
        : new Date(b.fecha_creacion) - new Date(a.fecha_creacion);
    }
    return 0;
  });

  const datosPagina = ordenadas.slice(
    (paginaActual - 1) * porPagina,
    paginaActual * porPagina
  );
  const totalPaginas = Math.ceil(ordenadas.length / porPagina);

  const generarBotonesPaginacion = () => {
    const botones = [];
    const max = 5;
    if (totalPaginas <= max) {
      for (let i = 1; i <= totalPaginas; i++) botones.push(i);
    } else if (paginaActual <= 3) {
      botones.push(1, 2, 3, 4, "...", totalPaginas);
    } else if (paginaActual >= totalPaginas - 2) {
      botones.push(
        1,
        "...",
        totalPaginas - 3,
        totalPaginas - 2,
        totalPaginas - 1,
        totalPaginas
      );
    } else {
      botones.push(
        1,
        "...",
        paginaActual - 1,
        paginaActual,
        paginaActual + 1,
        "...",
        totalPaginas
      );
    }
    return botones;
  };

  // Exportar
  const exportarExcel = () => {
    const datos = ordenadas.map((s) => ({
      Radicado: s.radicado,
      Fecha: new Date(s.fecha_creacion).toLocaleDateString(),
      "Fecha de finalización": s.fecha_vencimiento
        ? new Date(s.fecha_vencimiento).toLocaleDateString()
        : "-",
      Peticionario: `${s.nombre} ${s.apellido}`,
      TipoPQRSD: s.tipo_pqrsd || "No definido",
      Estado: s.estado,
      Encargado: s.encargado_nombre || "Sin asignar",
    }));
    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PQRSD");
    XLSX.writeFile(wb, "ConsultorPQRSD.xlsx");
  };

  const badgeEstado = (e) => {
    const m = {
      Pendiente: "bg-orange-100 text-orange-700",
      Asignado: "bg-blue-100 text-blue-700",
      "En revisión": "bg-purple-100 text-purple-700",
      Firmado: "bg-green-100 text-green-700",
      "Para notificar": "bg-gray-100 text-gray-700",
      Terminado: "bg-gray-300 text-gray-800",
    };
    return m[e] || "bg-slate-100 text-slate-700";
  };

  const calcularTooltip = (f) => {
    const diff = Math.floor(
      (new Date(f) - new Date()) / (1000 * 60 * 60 * 24)
    );
    if (diff < 0) return `Venció hace ${Math.abs(diff)} día(s)`;
    if (diff === 0) return "Vence hoy";
    return `Faltan ${diff} día(s)`;
  };

  // Acciones admin
  const eliminarSolicitud = async (id) => {
    if (!window.confirm("¿Eliminar esta solicitud?")) return;
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/solicitudes/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Solicitud eliminada");
      cargarSolicitudes();
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const reasignarEncargado = async () => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/solicitudes/${solicitudSeleccionada}/reasignar`,
        { nuevo_encargado: nuevoEncargado },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Reasignado");
      setMostrarModalReasignar(false);
      setNuevoEncargado("");
      setSolicitudSeleccionada(null);
      cargarSolicitudes();
    } catch {
      toast.error("Error al reasignar");
    }
  };

  return (
    <div className="p-4">
      <ToastContainer />
      <h2 className="text-2xl font-bold mb-4">Consultor de PQRSD</h2>

      {/* FILTROS */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3 mb-4">
        <input
          className="border rounded px-2 py-1"
          placeholder="Radicado"
          value={filtroRadicado}
          onChange={(e) => setFiltroRadicado(e.target.value)}
        />
        <input
          className="border rounded px-2 py-1"
          placeholder="Nombre"
          value={filtroNombre}
          onChange={(e) => setFiltroNombre(e.target.value)}
        />
        <input
          className="border rounded px-2 py-1"
          placeholder="Encargado"
          value={filtroEncargado}
          onChange={(e) => setFiltroEncargado(e.target.value)}
        />
        <input
          type="date"
          className="border rounded px-2 py-1"
          value={fechaDesde}
          onChange={(e) => setFechaDesde(e.target.value)}
        />
        <input
          type="date"
          className="border rounded px-2 py-1"
          value={fechaHasta}
          onChange={(e) => setFechaHasta(e.target.value)}
        />
        <select
          className="border rounded px-2 py-1"
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="">Todos</option>
          <option>Pendiente</option>
          <option>Asignado</option>
          <option>En revisión</option>
          <option>Firmado</option>
          <option>Para notificar</option>
          <option>Terminado</option>
        </select>
        <div className="relative">
          <input
            className="border rounded px-2 py-1 w-full"
            placeholder="Tipo PQRSD"
            value={filtroTipo}
            onChange={handleFiltroTipoChange}
          />
          {sugerenciasTipo.length > 0 && (
            <ul className="absolute bg-white border rounded w-full z-10">
              {sugerenciasTipo.map((t, i) => (
                <li
                  key={i}
                  className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
                  onClick={() => seleccionarSugerencia(t)}
                >
                  {t}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* EXPORTAR */}
      <div className="flex justify-end mb-4">
        <button
          onClick={exportarExcel}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
        >
          <FileDown size={16} /> Exportar a Excel
        </button>
      </div>

      {/* TABLA */}
      <div className="overflow-x-auto border rounded shadow">
        <table className="min-w-full text-sm">
          <thead className="bg-blue-800 text-white">
            <tr>
              <th
                className="px-4 py-2 cursor-pointer"
                onClick={() => cambiarOrden("radicado")}
              >
                Radicado <ArrowUpDown className="inline ml-1" size={14} />
              </th>
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Fecha fin</th>
              <th className="px-4 py-2">Peticionario</th>
              <th className="px-4 py-2">Tipo</th>
              <th className="px-4 py-2">Encargado</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2">Acción</th>
            </tr>
          </thead>
          <tbody>
            {datosPagina.map((s) => (
              <tr key={s.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2 font-mono">{s.radicado}</td>
                <td className="px-4 py-2">
                  {new Date(s.fecha_creacion).toLocaleDateString()}
                </td>
                <td className="px-4 py-2">
                  {s.fecha_vencimiento ? (
                    <span
                      title={calcularTooltip(s.fecha_vencimiento)}
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        new Date(s.fecha_vencimiento) < new Date()
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {new Date(s.fecha_vencimiento).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  {s.nombre} {s.apellido}
                </td>
                <td className="px-4 py-2">{s.tipo_pqrsd || "-"}</td>
                <td className="px-4 py-2">{s.encargado_nombre || "-"}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded text-xs ${badgeEstado(s.estado)}`}>
                    {s.estado}
                  </span>
                </td>
                <td className="px-4 py-2 flex flex-wrap gap-2">
                  <button
                    onClick={() => navigate(`/consultor/solicitud/${s.id}`)}
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-xs"
                  >
                    Ver
                  </button>
                  {rol === "admin" && (
                    <>
                      <button
                        onClick={() => {
                          setSolicitudSeleccionada(s.id);
                          setMostrarModalReasignar(true);
                        }}
                        className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 text-xs"
                      >
                        Reasignar
                      </button>
                      <button
                        onClick={() => eliminarSolicitud(s.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 text-xs"
                      >
                        Eliminar
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINACIÓN */}
      <div className="flex justify-center mt-4 gap-2">
        {generarBotonesPaginacion().map((n, i) =>
          n === "..." ? (
            <span key={i} className="px-3 py-1">…</span>
          ) : (
            <button
              key={i}
              onClick={() => setPaginaActual(n)}
              className={`px-3 py-1 rounded ${
                paginaActual === n
                  ? "bg-blue-700 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              } text-xs`}
            >
              {n}
            </button>
          )
        )}
      </div>

      {/* MODAL REASIGNAR */}
      {mostrarModalReasignar && rol === "admin" && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-6">
            <h3 className="font-bold mb-4">Reasignar responsable</h3>
            <select
              className="w-full border rounded px-3 py-2 mb-4"
              value={nuevoEncargado}
              onChange={(e) => setNuevoEncargado(e.target.value)}
            >
              <option value="">-- Seleccione --</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setMostrarModalReasignar(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={reasignarEncargado}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConsultorPQRSD;
