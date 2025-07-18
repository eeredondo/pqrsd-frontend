import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import socket from "../socket";
import CountUp from "react-countup";

function PanelAsignador() {
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState([]);
  const [todasSolicitudes, setTodasSolicitudes] = useState([]);
  const [notificaciones, setNotificaciones] = useState([]);
  const [mostrarPanel, setMostrarPanel] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [paginaActual, setPaginaActual] = useState(1);
  const solicitudesPorPagina = 10;

  const [ordenCampo, setOrdenCampo] = useState(null);
  const [ordenAscendente, setOrdenAscendente] = useState(true);

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
      setNotificaciones((prev) => [data, ...prev]);
      fetchSolicitudes();
      setTimeout(() => setNotificaciones([]), 8000);
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
      setTodasSolicitudes(res.data);
      const pendientes = res.data.filter((s) => s.estado === "Pendiente");
      setSolicitudes(pendientes);
    } catch (err) {
      console.error("Error al obtener solicitudes:", err);
    } finally {
      setCargando(false);
    }
  };

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

  const ordenarPorCampo = (campo) => {
    const nuevoOrdenAscendente = ordenCampo === campo ? !ordenAscendente : true;

    const solicitudesOrdenadas = [...solicitudes].sort((a, b) => {
      let valorA = a[campo] ?? "";
      let valorB = b[campo] ?? "";

      if (campo === "nombre") {
        valorA = (a.nombre + " " + a.apellido).toLowerCase();
        valorB = (b.nombre + " " + b.apellido).toLowerCase();
      }

      if (campo === "fecha_creacion" || campo === "fecha_vencimiento") {
        valorA = new Date(valorA);
        valorB = new Date(valorB);
      } else {
        valorA = valorA.toString().toLowerCase();
        valorB = valorB.toString().toLowerCase();
      }

      if (valorA < valorB) return nuevoOrdenAscendente ? -1 : 1;
      if (valorA > valorB) return nuevoOrdenAscendente ? 1 : -1;
      return 0;
    });

    setSolicitudes(solicitudesOrdenadas);
    setOrdenCampo(campo);
    setOrdenAscendente(nuevoOrdenAscendente);
    setPaginaActual(1);
  };

  const flechaOrden = (campo) => {
    if (ordenCampo !== campo) return "⇅";
    return ordenAscendente ? "⬆️" : "⬇️";
  };

  const indiceUltimaSolicitud = paginaActual * solicitudesPorPagina;
  const indicePrimeraSolicitud = indiceUltimaSolicitud - solicitudesPorPagina;
  const solicitudesActuales = solicitudes.slice(indicePrimeraSolicitud, indiceUltimaSolicitud);
  const totalPaginas = Math.ceil(solicitudes.length / solicitudesPorPagina);

  return (
    <div className="relative p-6">
      {/* BOTÓN NOTIFICACIONES */}
      <div className="absolute top-0 right-0 mt-4 mr-6 z-40">
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

      {/* SALUDO Y MOTIVACIÓN */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">{saludo}, {obtenerNombreUsuario()} 👋</h1>
        <p className="text-indigo-600 font-semibold mt-1">{mensajeMotivacional}</p>
      </div>

      <hr className="my-6 border-gray-200" />

      {/* TARJETAS DE RESUMEN */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border shadow rounded-lg p-4 flex items-center gap-4">
          <div className="bg-blue-100 p-2 rounded-full">📥</div>
          <div>
            <p className="text-sm text-gray-500">Total PQRSD recibidas</p>
            <p className="text-xl font-bold text-blue-700">
              <CountUp end={todasSolicitudes.length} duration={1} />
            </p>
          </div>
        </div>
        <div className="bg-white border shadow rounded-lg p-4 flex items-center gap-4">
          <div className="bg-green-100 p-2 rounded-full">✅</div>
          <div>
            <p className="text-sm text-gray-500">PQRSD asignadas</p>
            <p className="text-xl font-bold text-green-600">
              <CountUp end={todasSolicitudes.filter(s => s.asignado_a).length} duration={1} />
            </p>
          </div>
        </div>
        <div className="bg-white border shadow rounded-lg p-4 flex items-center gap-4">
          <div className="bg-orange-100 p-2 rounded-full">⏳</div>
          <div>
            <p className="text-sm text-gray-500">Sin asignar</p>
            <p className="text-xl font-bold text-orange-500">
              <CountUp end={todasSolicitudes.filter(s => !s.asignado_a).length} duration={1} />
            </p>
          </div>
        </div>
      </div>

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
                <th onClick={() => ordenarPorCampo("radicado")} className="px-4 py-2 cursor-pointer select-none hover:underline">
                  Radicado {flechaOrden("radicado")}
                </th>
                <th onClick={() => ordenarPorCampo("nombre")} className="px-4 py-2 cursor-pointer select-none hover:underline">
                  Peticionario {flechaOrden("nombre")}
                </th>
                <th onClick={() => ordenarPorCampo("correo")} className="px-4 py-2 cursor-pointer select-none hover:underline">
                  Correo {flechaOrden("correo")}
                </th>
                <th onClick={() => ordenarPorCampo("fecha_creacion")} className="px-4 py-2 cursor-pointer select-none hover:underline">
                  Fecha radicación {flechaOrden("fecha_creacion")}
                </th>
                <th onClick={() => ordenarPorCampo("fecha_vencimiento")} className="px-4 py-2 cursor-pointer select-none hover:underline">
                  Fecha vencimiento {flechaOrden("fecha_vencimiento")}
                </th>
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
