import React, { useEffect, useState } from "react";
import axios from "axios";
import { Eye, FileCheck, CalendarCheck, Archive, AlarmClock } from "lucide-react";
import { useNavigate } from "react-router-dom";

function PanelFinalizador() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const solicitudesPorPagina = 10;
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const usuario = JSON.parse(localStorage.getItem("usuario"));

  const obtenerSaludoConEmoji = () => {
    const hora = new Date().getHours();
    if (hora >= 5 && hora < 12) return "☀️ Buenos días";
    if (hora >= 12 && hora < 18) return "🌇 Buenas tardes";
    return "🌙 Buenas noches";
  };

  const obtenerNombreUsuario = () => {
    if (usuario?.nombre) return usuario.nombre;
    if (usuario?.usuario) return usuario.usuario;
    return "Usuario";
  };

  useEffect(() => {
    if (!token) return;
    fetchFirmadas();
  }, [token]);

  const fetchFirmadas = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/solicitudes/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const firmadas = res.data.filter((s) => s.estado === "Firmado");
      setSolicitudes(firmadas);
    } catch (err) {
      console.error("Error al obtener solicitudes firmadas:", err);
    }
  };

  const calcularDias = (fechaStr) => {
    if (!fechaStr) return "-";
    const venc = new Date(fechaStr);
    const hoy = new Date();
    const diff = Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? `Faltan ${diff} días` : `Venció hace ${Math.abs(diff)} días`;
  };

  const indiceUltimaSolicitud = paginaActual * solicitudesPorPagina;
  const indicePrimeraSolicitud = indiceUltimaSolicitud - solicitudesPorPagina;
  const solicitudesActuales = solicitudes.slice(indicePrimeraSolicitud, indiceUltimaSolicitud);
  const totalPaginas = Math.ceil(solicitudes.length / solicitudesPorPagina);

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
    setPaginaActual(nuevaPagina);
  };

  const saludo = obtenerSaludoConEmoji();

  return (
    <div className="p-6">
      
      {/* SALUDO */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {saludo}, {obtenerNombreUsuario()} 👋
        </h1>
      </div>

      {/* TÍTULO */}
      <h2 className="text-2xl font-bold text-blue-800 mb-6">
        📩 Solicitudes Firmadas para Finalizar
      </h2>

      {/* TARJETAS RESUMEN */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border shadow rounded-lg p-4 flex items-center gap-4">
          <div className="bg-blue-100 p-2 rounded-full">
            <FileCheck className="text-blue-700" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total firmadas</p>
            <p className="text-xl font-bold text-blue-800">{solicitudes.length}</p>
          </div>
        </div>

        <div className="bg-white border shadow rounded-lg p-4 flex items-center gap-4">
          <div className="bg-green-100 p-2 rounded-full">
            <CalendarCheck className="text-green-700" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Firmadas hoy</p>
            <p className="text-xl font-bold text-green-700">
              {
                solicitudes.filter(
                  (s) => new Date(s.fecha_creacion).toDateString() === new Date().toDateString()
                ).length
              }
            </p>
          </div>
        </div>

        <div className="bg-white border shadow rounded-lg p-4 flex items-center gap-4">
          <div className="bg-gray-100 p-2 rounded-full">
            <Archive className="text-gray-600" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Sin fecha límite</p>
            <p className="text-xl font-bold text-gray-800">
              {solicitudes.filter((s) => !s.fecha_vencimiento).length}
            </p>
          </div>
        </div>
      </div>

      {/* TABLA */}
      <div className="overflow-x-auto shadow border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-blue-800 text-white">
            <tr>
              <th className="px-4 py-3 font-medium">Radicado</th>
              <th className="px-4 py-3 font-medium">Fecha</th>
              <th className="px-4 py-3 font-medium">Peticionario</th>
              <th className="px-4 py-3 font-medium">Tipo de PQRSD</th> {/* 👈 Nueva columna */}
              <th className="px-4 py-3 font-medium">Vence en</th>
              <th className="px-4 py-3 font-medium text-center">Acción</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {solicitudesActuales.map((s) => (
              <tr key={s.id} className="hover:bg-blue-50 transition duration-150 ease-in-out">
                <td className="px-4 py-3 font-mono text-blue-800">{s.radicado}</td>
                <td className="px-4 py-3">
                  {new Date(s.fecha_creacion).toLocaleDateString("es-CO", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td className="px-4 py-3">{s.nombre} {s.apellido}</td>
                <td className="px-4 py-3">{s.tipo_pqrsd || "No definido"}</td> {/* 👈 Nueva celda */}
                <td className="px-4 py-3 text-gray-700 flex items-center gap-1">
                  <AlarmClock size={16} className="text-gray-500" />
                  {calcularDias(s.fecha_vencimiento)}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => navigate(`/finalizar/solicitud/${s.id}`)}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded transition"
                    title="Ver detalles y finalizar"
                  >
                    <Eye size={16} />
                    Detalles
                  </button>
                </td>
              </tr>
            ))}
            {solicitudes.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center p-4 text-gray-500 italic">
                  No hay solicitudes firmadas para finalizar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINACIÓN */}
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

export default PanelFinalizador;
