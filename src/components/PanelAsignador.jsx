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

      {/* MINI PERFIL */}
      <div className="absolute top-0 left-0 mt-4 ml-6 flex items-center gap-2">
        <div className="bg-blue-100 p-2 rounded-full">
          <User className="text-blue-600" size={20} />
        </div>
        <span className="text-blue-700 font-semibold text-sm">{obtenerNombreUsuario()}</span>
      </div>

      {/* SALUDO Y FECHA */}
      <h1 className="text-2xl font-bold mb-1 mt-14">
        {saludo}, {obtenerNombreUsuario()}
      </h1>
      <p className="text-gray-500 text-sm">{fechaHoy}</p>
      <p className="text-indigo-600 font-semibold mt-3">{mensajeMotivacional}</p>

      {/* TARJETAS DE RESUMEN */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
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

      {/* El resto de tu tabla, loader y paginación sigue igual... */}

    </div>
  );
}

export default PanelAsignador;
