import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Bell, User } from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import socket from "../socket";
import CountUp from "react-countup";

function PanelAsignador() {
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState([]);
  const [notificaciones, setNotificaciones] = useState([]);
  const [mostrarPanel, setMostrarPanel] = useState(false);
  const [nuevaNotificacion, setNuevaNotificacion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);
  const solicitudesPorPagina = 10;

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

  const fechaHoy = new Date().toLocaleDateString("es-CO", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const mensajesMotivacionales = [
    "✨ ¡Hoy es un gran día para avanzar!",
    "🚀 ¡Un paso más cerca de tus metas!",
    "🌟 ¡Cada solicitud cuenta!",
    "💪 ¡Tú puedes con todo!",
    "🔥 ¡Eres parte del cambio!"
  ];

  const mensajeMotivacional = mensajesMotivacionales[
    Math.floor(Math.random() * mensajesMotivacionales.length)
  ];

  const saludo = obtenerSaludoConEmoji();

  useEffect(() => {
    if (!token) return;

    fetchSolicitudes();
    socket.connect();

    socket.on("connect", () => {
      console.log("✅ WebSocket conectado");
    });

    socket.on("nueva_solicitud", (data) => {
      toast.info(`📬 Nueva solicitud: ${data.radicado}`);
      setNuevaNotificacion(data);
      setNotificaciones((prev) => [data, ...prev]);
      fetchSolicitudes();
      setTimeout(() => setNuevaNotificacion(null), 8000);
    });

    return () => {
      socket.off("nueva_solicitud");
      socket.disconnect();
    };
  }, [token]);

  const fetchSolicitudes = async () => {
    try {
      setCargando(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/solicitudes/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const pendientes = res.data.filter((s) => s.estado === "Pendiente");
      setSolicitudes(pendientes);
    } catch (err) {
      console.error("Error al obtener solicitudes:", err);
    } finally {
      setCargando(false);
    }
  };

  const indiceUltimaSolicitud = paginaActual * solicitudesPorPagina;
  const indicePrimeraSolicitud = indiceUltimaSolicitud - solicitudesPorPagina;
  const solicitudesActuales = solicitudes.slice(indicePrimeraSolicitud, indiceUltimaSolicitud);
  const totalPaginas = Math.ceil(solicitudes.length / solicitudesPorPagina);

  const cambiarPagina = (nuevaPagina) => {
    if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
    setPaginaActual(nuevaPagina);
  };

  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return "–";
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  return (
    <div className="relative p-6">

      {/* HEADER ELEGANTE */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2 text-blue-700 font-semibold">
          <User size={20} />
          <span>{obtenerNombreUsuario()}</span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-600 text-sm capitalize">{usuario?.rol}</span>
          <span className="text-gray-400">|</span>
          <span className="text-gray-600 text-sm">{fechaHoy}</span>
        </div>

        <div className="relative">
          <button onClick={() => setMostrarPanel(!mostrarPanel)} className="relative">
            <Bell className="text-blue-700 w-6 h-6" />
            {notificaciones.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                {notificaciones.length}
              </span>
            )}
          </button>

          {mostrarPanel && (
            <div className="absolute right-0 mt-2 w-80 bg-white shadow-xl border rounded-lg z-50 max-h-96 overflow-y-auto">
              <div className="p-3 border-b font-bold text-blue-800">Notificaciones</div>
              {notificaciones.length === 0 ? (
                <div className="p-3 text-gray-500 text-sm">No hay notificaciones.</div>
              ) : (
                <ul className="divide-y">
                  {notificaciones.map((n, idx) => (
                    <li key={idx} className="p-3">
                      <p className="text-sm text-blue-800 font-semibold">{n.radicado}</p>
                      <p className="text-xs text-gray-600">{n.nombre} {n.apellido}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SALUDO Y MOTIVACIÓN */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{saludo}, {obtenerNombreUsuario()} 👋</h1>
        <p className="text-indigo-600 font-semibold mt-1">{mensajeMotivacional}</p>
      </div>

      {/* TARJETAS DE RESUMEN */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border shadow rounded-lg p-4 flex items-center gap-4">
          <div className="bg-blue-100 p-2 rounded-full">📥</div>
          <div>
            <p className="text-sm text-gray-500">Total PQRSD recibidas</p>
            <p className="text-xl font-bold text-blue-700">
              <CountUp end={solicitudes.length} duration={1} />
            </p>
          </div>
        </div>

        <div className="bg-white border shadow rounded-lg p-4 flex items-center gap-4">
          <div className="bg-green-100 p-2 rounded-full">✅</div>
          <div>
            <p className="text-sm text-gray-500">PQRSD asignadas</p>
            <p className="text-xl font-bold text-green-600">
              <CountUp end={solicitudes.filter(s => s.asignado === true).length} duration={1} />
            </p>
          </div>
        </div>

        <div className="bg-white border shadow rounded-lg p-4 flex items-center gap-4">
          <div className="bg-orange-100 p-2 rounded-full">⏳</div>
          <div>
            <p className="text-sm text-gray-500">Sin asignar</p>
            <p className="text-xl font-bold text-orange-500">
              <CountUp end={solicitudes.filter(s => s.asignado !== true).length} duration={1} />
            </p>
          </div>
        </div>
      </div>

      {/* TABLA SOLICITUDES */}
      <h2 className="text-xl font-bold text-gray-800 mb-4">Solicitudes sin asignar</h2>

      {cargando ? (
        <div className="flex justify-center items-center my-10">
          <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : solicitudes.length === 0 ? (
        <p className="text-gray-600 text-sm">No hay solicitudes pendientes por asignar.</p>
      ) : (
        <div className="overflow-x-auto shadow border border-gray-200 rounded-lg">
          <table className="min-w-full bg-white text-sm">
            <thead className="bg-blue-800 text-white text-left">
              <tr>
                <th className="px-4 py-2">Radicado</th>
                <th className="px-4 py-2">Peticionario</th>
                <th className="px-4 py-2">Correo</th>
                <th className="px-4 py-2">Fecha radicación</th>
                <th className="px-4 py-2">Fecha vencimiento</th>
                <th className="px-4 py-2">Acción</th>
              </tr>
            </thead>
            <tbody>
              {solicitudesActuales.map((s) => (
                <tr key={s.id} className="border-t hover:bg-blue-50">
                  <td className="px-4 py-2 font-mono">{s.radicado}</td>
                  <td className="px-4 py-2">{s.nombre} {s.apellido}</td>
                  <td className="px-4 py-2">{s.correo}</td>
                  <td className="px-4 py-2">{formatearFecha(s.fecha_creacion)}</td>
                  <td className="px-4 py-2">{formatearFecha(s.fecha_vencimiento)}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => navigate(`/solicitud/${s.id}`)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                    >
                      Ver detalles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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

export default PanelAsignador;
