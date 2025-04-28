import React, { useEffect, useState } from "react";
import axios from "axios";
import { ArrowUpDown, FileDown } from "lucide-react";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";

function ConsultorPQRSD() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [filtroRadicado, setFiltroRadicado] = useState("");
  const [filtroNombre, setFiltroNombre] = useState("");
  const [filtroEncargado, setFiltroEncargado] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");  // Agregado filtro por tipo
  const [orden, setOrden] = useState({ campo: "radicado", asc: false });
  const [paginaActual, setPaginaActual] = useState(1);
  const porPagina = 10;
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    cargarSolicitudes();
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

  const cambiarOrden = (campo) => {
    setOrden((prev) => ({ campo, asc: prev.campo === campo ? !prev.asc : true }));
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
      (!filtroTipo || s.tipo_pqrsd === filtroTipo) &&  // Filtro por tipo de PQRSD
      (!fechaDesde || fecha >= new Date(fechaDesde)) &&
      (!fechaHasta || fecha <= new Date(fechaHasta))
    );
  });

  const ordenar = [...filtrar].sort((a, b) => {
    const { campo, asc } = orden;
    if (campo === "radicado") return asc ? a.radicado.localeCompare(b.radicado) : b.radicado.localeCompare(a.radicado);
    if (campo === "fecha") return asc ? new Date(a.fecha_creacion) - new Date(b.fecha_creacion) : new Date(b.fecha_creacion) - new Date(a.fecha_creacion);
    return 0;
  });

  const exportarExcel = () => {
    const datos = ordenar.map((s) => ({
      Radicado: s.radicado,
      Fecha: new Date(s.fecha_creacion).toLocaleDateString(),
      "Fecha de finalización": s.fecha_vencimiento ? new Date(s.fecha_vencimiento).toLocaleDateString() : "-",
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

  const datosPagina = ordenar.slice((paginaActual - 1) * porPagina, paginaActual * porPagina);
  const totalPaginas = Math.ceil(ordenar.length / porPagina);

  return (
    <div>
      <h2 className="text-2xl font-bold text-blue-800 mb-4">Consultor de PQRSD</h2>

      {/* FILTROS */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
        <input
          type="text"
          placeholder="Radicado"
          value={filtroRadicado}
          onChange={(e) => setFiltroRadicado(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        />
        <input
          type="text"
          placeholder="Nombre del peticionario"
          value={filtroNombre}
          onChange={(e) => setFiltroNombre(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        />
        <input
          type="text"
          placeholder="Encargado actual"
          value={filtroEncargado}
          onChange={(e) => setFiltroEncargado(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={fechaDesde}
          onChange={(e) => setFechaDesde(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        />
        <input
          type="date"
          value={fechaHasta}
          onChange={(e) => setFechaHasta(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        />
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="">Todos</option>
          <option value="Pendiente">Pendiente</option>
          <option value="Asignado">Asignado</option>
          <option value="En revisión">En revisión</option>
          <option value="Firmado">Firmado</option>
          <option value="Para notificar">Para notificar</option>
          <option value="Terminado">Terminado</option>
        </select>
        {/* Filtro por Tipo de PQRSD */}
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="">Todos</option>
          <option value="Queja">Queja</option>
          <option value="Sugerencia">Sugerencia</option>
          <option value="Reclamo">Reclamo</option>
        </select>
      </div>

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
              <th className="px-4 py-2 cursor-pointer" onClick={() => cambiarOrden("radicado")}>
                Radicado <ArrowUpDown size={14} className="inline-block ml-1" />
              </th>
              <th className="px-4 py-2">Fecha</th>
              <th className="px-4 py-2">Fecha de finalización</th>
              <th className="px-4 py-2">Peticionario</th>
              <th className="px-4 py-2">Tipo de PQRSD</th> {/* 👈 Nueva columna */}
              <th className="px-4 py-2">Encargado</th>
              <th className="px-4 py-2">Estado</th>
              <th className="px-4 py-2">Acción</th>
            </tr>
          </thead>
          <tbody>
            {datosPagina.map((s) => (
              <tr key={s.id} className="border-t hover:bg-blue-50">
                <td className="px-4 py-2 font-mono">{s.radicado}</td>
                <td className="px-4 py-2">{new Date(s.fecha_creacion).toLocaleDateString()}</td>
                <td className="px-4 py-2">
                  {s.fecha_vencimiento ? (
                    <span
                      className={`font-semibold px-2 py-1 rounded text-xs ${
                        new Date(s.fecha_vencimiento) < new Date() ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                      }`}
                      title={calcularTooltip(s.fecha_vencimiento)}
                    >
                      {new Date(s.fecha_vencimiento).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-2">{s.nombre} {s.apellido}</td>
                <td className="px-4 py-2">{s.tipo_pqrsd || "No definido"}</td> {/* 👈 Nueva celda */}
                <td className="px-4 py-2">{s.encargado_nombre || "Sin asignar"}</td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${badgeEstado(s.estado)}`}>
                    {s.estado}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <button onClick={() => navigate(`/consultor/solicitud/${s.id}`)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm">
                    Ver detalles
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINACIÓN */}
      <div className="flex justify-center mt-4 space-x-2">
        {Array.from({ length: totalPaginas }, (_, i) => (
          <button
            key={i}
            onClick={() => setPaginaActual(i + 1)}
            className={`px-3 py-1 rounded text-sm ${paginaActual === i + 1 ? "bg-blue-700 text-white" : "bg-gray-200 text-gray-800"}`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

export default ConsultorPQRSD;
