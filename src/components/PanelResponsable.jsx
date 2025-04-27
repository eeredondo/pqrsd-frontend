import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Eye, Inbox, Clock, AlertCircle, CalendarX } from "lucide-react";

function PanelResponsable() {
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const solicitudesPorPagina = 10;

  const usuario = JSON.parse(localStorage.getItem("usuario"));
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!usuario || usuario.rol !== "responsable") {
      navigate("/");
      return;
    }

    const fetchSolicitudes = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/solicitudes/asignadas/${usuario.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const visibles = res.data.filter((s) =>
          ["Asignado", "En proceso", "Devuelto"].includes(s.estado)
        );

        setSolicitudes(visibles);
      } catch (err) {
        console.error("Error al obtener solicitudes asignadas:", err);
      }
    };

    fetchSolicitudes();
  }, [usuario, token, navigate]);

  const calcularColorFecha = (fecha) => {
    const hoy = new Date();
    const vencimiento = new Date(fecha);
    const diff = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24));

    if (diff < 0) return "text-red-600";
    if (diff <= 2) return "text-yellow-500";
    return "text-green-600";
  };

  const indiceUltimaSolicitud = paginaActual * solicitudesPorPagina;
  const indicePrimeraSolicitud = indiceUltimaSolicitud - solicitudesPorPagina;
  const solicitudesActuales = solicitudes.slice(indicePrimeraSolicitud, indiceUltimaSolicitud);
  const totalPaginas = Math.ceil(solicitudes.length / solicitudesPorPagina);

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
    setPaginaActual(nuevaPagina);
  };

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border shadow rounded-lg p-4 flex items-center gap-4">
          <div className="bg-blue-100 p-2 rounded-full">
            <Inbox className="text-blue-600" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total asignadas</p>
            <p className="text-xl font-bold text-blue-700">{solicitudes.length}</p>
          </div>
        </div>

        <div className="bg-white border shadow rounded-lg p-4 flex items-center gap-4">
          <div className="bg-red-100 p-2 rounded-full">
            <AlertCircle className="text-red-600" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Devueltas</p>
            <p className="text-xl font-bold text-red-600">
              {solicitudes.filter((s) => s.estado === "Devuelto").length}
            </p>
          </div>
        </div>

        <div className="bg-white border shadow rounded-lg p-4 flex items-center gap-4">
          <div className="bg-gray-200 p-2 rounded-full">
            <CalendarX className="text-gray-700" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Sin fecha límite</p>
            <p className="text-xl font-bold text-gray-700">
              {solicitudes.filter((s) => !s.fecha_vencimiento).length}
            </p>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-blue-800 mb-4">📋 Solicitudes Asignadas</h2>

      <div className="overflow-x-auto shadow border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-blue-800 text-white">
            <tr>
              <th className="px-4 py-3">Radicado</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Vencimiento</th>
              <th className="px-4 py-3">Peticionario</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-center">Acción</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {solicitudesActuales.map((s) => (
              <tr key={s.id} className="hover:bg-blue-50">
                <td className="px-4 py-3 font-mono text-blue-800">{s.radicado}</td>
                <td className="px-4 py-3">{new Date(s.fecha_creacion).toLocaleDateString("es-CO")}</td>
                <td className={`px-4 py-3 font-semibold ${calcularColorFecha(s.fecha_vencimiento)}`}>
                  {s.fecha_vencimiento
                    ? new Date(s.fecha_vencimiento).toLocaleDateString("es-CO")
                    : "Sin fecha"}
                </td>
                <td className="px-4 py-3">{s.nombre} {s.apellido}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    s.estado === "Devuelto"
                      ? "bg-red-100 text-red-700"
                      : s.estado === "En proceso"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-blue-100 text-blue-700"
                  }`}>
                    {s.estado}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => navigate(`/responsable/solicitud/${s.id}`)}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded"
                  >
                    <Eye size={16} /> Ver Detalles
                  </button>
                </td>
              </tr>
            ))}
            {solicitudes.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center p-4 text-gray-500 italic">
                  No tienes solicitudes asignadas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex justify-center items-center mt-6 space-x-2">
          <button
            onClick={() => cambiarPagina(paginaActual - 1)}
            disabled={paginaActual === 1}
            className={`px-3 py-1 rounded ${paginaActual === 1 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
          >
            Anterior
          </button>
          {Array.from({ length: totalPaginas }, (_, i) => (
            <button
              key={i}
              onClick={() => cambiarPagina(i + 1)}
              className={`px-3 py-1 rounded ${paginaActual === i + 1 ? 'bg-blue-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => cambiarPagina(paginaActual + 1)}
            disabled={paginaActual === totalPaginas}
            className={`px-3 py-1 rounded ${paginaActual === totalPaginas ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}

export default PanelResponsable;
