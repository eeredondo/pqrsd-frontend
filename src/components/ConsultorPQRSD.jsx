import React, { useEffect, useState } from "react";
import axios from "axios";
import { ArrowUpDown, FileDown } from "lucide-react";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Función para decodificar JWT sin dependencia externa
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
    // Carga inicial de datos
    cargarSolicitudes();
    fetchUsuarios();
    if (token) {
      const decoded = decodeJWT(token);
      setRol(decoded?.rol || "");
    }
  }, []);

  const cargarSolicitudes = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/solicitudes/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSolicitudes(res.data);
    } catch (err) {
      console.error("Error al cargar solicitudes:", err);
    }
  };

  const fetchUsuarios = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/usuarios/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsuarios(res.data);
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
    }
  };

  const cambiarOrden = (campo) => {
    setOrden((prev) => ({ campo, asc: prev.campo === campo ? !prev.asc : true }));
  };

  const tiposExistentes = Array.from(
    new Set(solicitudes.map((s) => s.tipo_pqrsd).filter(Boolean))
  );

  const handleFiltroTipoChange = (e) => {
    const valor = e.target.value;
    setFiltroTipo(valor);
    if (valor.length > 0) {
      const sugerencias = tiposExistentes.filter((tipo) =>
        tipo.toLowerCase().includes(valor.toLowerCase())
      );
      setSugerenciasTipo(sugerencias);
    } else {
      setSugerenciasTipo([]);
    }
  };

  const seleccionarSugerencia = (tipo) => {
    setFiltroTipo(tipo);
    setSugerenciasTipo([]);
  };

  const filtrar = solicitudes.filter((s) => {
    const nombreCompleto = `${s.nombre} ${s.apellido}`.toLowerCase();
    const encargado = s.encargado_nombre?.toLowerCase() || "";
    const fecha = new Date(s.fecha_creacion);
    return (
      s.radicado.toLowerCase().includes(filtroRadicado.toLowerCase()) &&
      nombreCompleto.includes(filtroNombre.toLowerCase()) &&
      encargado.includes(filtroEncargado.toLowerCase()) &&
      (!filtroEstado || s.estado === filtroEstado) &&
      (!filtroTipo ||
        (s.tipo_pqrsd &&
          s.tipo_pqrsd.toLowerCase().includes(filtroTipo.toLowerCase()))) &&
      (!fechaDesde || fecha >= new Date(fechaDesde)) &&
      (!fechaHasta || fecha <= new Date(fechaHasta))
    );
  });

  const ordenar = [...filtrar].sort((a, b) => {
    const { campo, asc } = orden;
    if (campo === "radicado")
      return asc
        ? a.radicado.localeCompare(b.radicado)
        : b.radicado.localeCompare(a.radicado);
    if (campo === "fecha")
      return asc
        ? new Date(a.fecha_creacion) - new Date(b.fecha_creacion)
        : new Date(b.fecha_creacion) - new Date(a.fecha_creacion);
    return 0;
  });

  const exportarExcel = () => {
    const datos = ordenar.map((s) => ({
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

  const badgeEstado = (estado) => {
    const colores = {
      Pendiente: "bg-orange-100 text-orange-700",
      Asignado: "bg-blue-100 text-blue-700",
      "En revisión": "bg-purple-100 text-purple-700",
      Firmado: "bg-green-100 text-green-700",
      "Para notificar": "bg-gray-100 text-gray-700",
      Terminado: "bg-gray-300 text-gray-800",
    };
    return colores[estado] || "bg-slate-100 text-slate-700";
  };

  const calcularTooltip = (fechaStr) => {
    const venc = new Date(fechaStr);
    const hoy = new Date();
    const diff = Math.floor((venc - hoy) / (1000 * 60 * 60 * 24));
    if (diff < 0) return `Venció hace ${Math.abs(diff)} día(s)`;
    if (diff === 0) return "Vence hoy";
    return `Faltan ${diff} día(s)`;
  };

  const eliminarSolicitud = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar esta solicitud?")) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/solicitudes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Solicitud eliminada correctamente");
      cargarSolicitudes();
    } catch (err) {
      toast.error("Error al eliminar la solicitud");
      console.error(err);
    }
  };

  const reasignarEncargado = async () => {
    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/solicitudes/${solicitudSeleccionada}/reasignar`,
        { nuevo_encargado: nuevoEncargado },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Encargado reasignado correctamente");
      setMostrarModalReasignar(false);
      setNuevoEncargado("");
      setSolicitudSeleccionada(null);
      cargarSolicitudes();
    } catch (err) {
      toast.error("Error al reasignar el encargado");
      console.error(err);
    }
  };

  const datosPagina = ordenar.slice(
    (paginaActual - 1) * porPagina,
    paginaActual * porPagina
  );
  const totalPaginas = Math.ceil(ordenar.length / porPagina);

  const generarBotonesPaginacion = () => {
    const botones = [];
    const mostrarMax = 5;
    if (totalPaginas <= mostrarMax) {
      for (let i = 1; i <= totalPaginas; i++) botones.push(i);
    } else {
      if (paginaActual <= 3) {
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
    }
    return botones;
  };

  return (
    <div>
      <ToastContainer />
      <h2 className="text-2xl font-bold text-blue-800 mb-4">
        Consultor de PQRSD
      </h2>

      {/* FILTROS */}
      {/* ... (idénticos a tu anterior) ... */}

      {/* EXPORTAR */}
      <div className="mb-4 flex justify-end">
        <button
          onClick={exportarExcel}
          className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800 text-sm"
        >
          <FileDown size={16} /> Exportar a Excel
        </button>
      </div>

      {/* TABLA */}
      <div className="overflow-x-auto shadow border border-gray-200 rounded-lg">
        <table className="min-w-full bg-white text-sm">
          <thead className="bg-blue-800 text-white text-left">
            <tr>
              <th
                className="px-4 py-2 cursor-pointer"
                onClick={() => cambiarOrden("radicado")}
              >
                Radicado <ArrowUpDown size={14} className="inline-block ml-1" />
              </th>
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Fecha de finalización</th>
              <th className="px-4 py-2">Peticionario</th>
              <th className="px-4 py-2">Tipo de PQRSD</th>
              <th className="px-4 py-2">Encargado</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2">Acción</th>
            </tr>
          </thead>
          <tbody>
            {datosPagina.map((s) => (
              <tr key={s.id} className="border-t hover:bg-blue-50">
                {/* ... demás columnas ... */}
                <td className="px-4 py-2 flex flex-wrap gap-2">
                  <button
                    onClick={() => navigate(`/consultor/solicitud/${s.id}`)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Ver detalles
                  </button>

                  {rol === "admin" && (
                    <>
                      <button
                        onClick={() => {
                          setSolicitudSeleccionada(s.id);
                          setMostrarModalReasignar(true);
                        }}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Reasignar
                      </button>
                      <button
                        onClick={() => eliminarSolicitud(s.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
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
      {/* ... idéntico ... */}

      {/* MODAL REASIGNAR */}
      {mostrarModalReasignar && rol === "admin" && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-80 shadow-lg">
            <h3 className="text-lg font-bold mb-4">Reasignar encargado</h3>
            <select
              value={nuevoEncargado}
              onChange={(e) => setNuevoEncargado(e.target.value)}
              className="w-full border px-3 py-2 rounded mb-4 text-sm"
            >
              <option value="">-- Seleccione usuario --</option>
              {usuarios.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre}
                </option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setMostrarModalReasignar(false)}
                className="px-4 py-2 text-sm bg-gray-300 hover:bg-gray-400 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={reasignarEncargado}
                className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded"
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
