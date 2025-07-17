import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs";
import {
  ArrowLeft, FileDown, Mail, User, Phone, MapPin, Loader2, CheckCircle2, XCircle
} from "lucide-react";
import { toast } from "react-toastify";

function DetalleRevisor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [solicitud, setSolicitud] = useState(null);
  const [trazabilidad, setTrazabilidad] = useState([]);
  const [comentario, setComentario] = useState("");
  const [pestana, setPestana] = useState("pqrsd");
  const [enviando, setEnviando] = useState(false);
  const [resultadoRevision, setResultadoRevision] = useState(null); // "aprobada" o "devuelta"

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/solicitudes/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSolicitud(res.data);

        const traz = await axios.get(`${import.meta.env.VITE_API_URL}/solicitudes/${id}/trazabilidad`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTrazabilidad(traz.data);
      } catch (err) {
        console.error("Error al cargar detalles:", err);
      }
    };

    fetchData();
  }, [id, token]);

  const revisarSolicitud = async (aprobado) => {
    if (!aprobado && comentario.trim() === "") {
      toast.warn("⚠️ Debes escribir un comentario si vas a devolver la solicitud.", {
        position: "top-right",
      });
      return;
    }

    try {
      setEnviando(true);
      await axios.post(
        `${import.meta.env.VITE_API_URL}/solicitudes/${id}/revision`,
        { aprobado, comentario },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setResultadoRevision(aprobado ? "aprobada" : "devuelta");
    } catch (error) {
      console.error("Error al revisar:", error);
      toast.error("❌ Error al procesar la revisión.", {
        position: "top-right",
      });
    } finally {
      setEnviando(false);
    }
  };

  useEffect(() => {
    if (resultadoRevision) {
      toast.success(`✅ Solicitud ${resultadoRevision} correctamente`, {
        position: "top-right",
        autoClose: 2000,
      });

      setTimeout(() => {
        navigate("/revisor");
      }, 3000);
    }
  }, [resultadoRevision, navigate]);

  if (!solicitud) return <div className="p-6">Cargando detalles...</div>;

  if (resultadoRevision) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50 px-4">
        {resultadoRevision === "aprobada" ? (
          <CheckCircle2 size={80} className="text-green-500 mb-4 animate-pulse" />
        ) : (
          <XCircle size={80} className="text-red-500 mb-4 animate-pulse" />
        )}
        <h1 className="text-2xl font-bold text-gray-700 mb-2">
          {resultadoRevision === "aprobada" ? "¡Solicitud aprobada!" : "¡Solicitud devuelta!"}
        </h1>
        <p className="text-gray-600 mb-6">
          El radicado <span className="font-semibold">{solicitud.radicado}</span> fue {resultadoRevision} exitosamente.
        </p>
        <p className="text-sm text-gray-500">Redirigiendo al panel de revisor...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <button onClick={() => navigate("/revisor")} className="mb-4 inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold">
        <ArrowLeft size={18} className="mr-1" /> Volver
      </button>

      <h2 className="text-2xl font-bold text-blue-800 mb-6">Detalle de Solicitud: {solicitud.radicado}</h2>

      <div className="flex gap-4 border-b mb-6">
        {["datos", "pqrsd", "trazabilidad"].map((tab) => (
          <button
            key={tab}
            onClick={() => setPestana(tab)}
            className={`px-4 py-2 font-semibold border-b-4 ${
              pestana === tab
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-500 hover:text-blue-600"
            }`}
          >
            {tab === "datos" && "Datos del Peticionario"}
            {tab === "pqrsd" && "PQRSD"}
            {tab === "trazabilidad" && "Trazabilidad"}
          </button>
        ))}
      </div>

      {pestana === "datos" && (
        <div className="bg-white border rounded-xl p-6 shadow-md space-y-2 max-w-3xl mx-auto">
          <p><User className="inline mr-2 text-gray-500" /> {solicitud.nombre} {solicitud.apellido}</p>
          <p><Mail className="inline mr-2 text-gray-500" /> {solicitud.correo}</p>
          <p><Phone className="inline mr-2 text-gray-500" /> {solicitud.celular}</p>
          <p><MapPin className="inline mr-2 text-gray-500" /> {solicitud.municipio}, {solicitud.departamento}</p>
        </div>
      )}

      {pestana === "pqrsd" && (
        <div className="bg-white border rounded-xl p-6 shadow-md space-y-6 max-w-6xl mx-auto">
          <div>
            <h3 className="text-sm text-gray-600 font-medium">📎 Archivo del ciudadano:</h3>      
            {solicitud.archivo ? (
              <iframe
                src={`${import.meta.env.VITE_API_URL}/${solicitud.archivo}`}
                className="w-full h-[1000px] border rounded"
                title="Petición Ciudadana"
              ></iframe>
            ) : (
              <p className="text-red-500 italic">No hay archivo de petición disponible.</p>
            )}
          </div>

          {solicitud.archivo_respuesta && (
            <div>
              <h3 className="text-sm text-gray-600 font-medium">📥 Descargar archivo Word original:</h3>
              <a
                href={`${import.meta.env.VITE_API_URL}/${solicitud.archivo_respuesta}`}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline inline-flex items-center"
              >
                <FileDown className="mr-2" size={18} /> Descargar Word
              </a>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Comentario del Revisor (obligatorio si se va a devolver):
            </label>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={4}
              placeholder="Ej: Favor ajustar la redacción..."
              className="w-full p-3 border rounded resize-none text-sm"
            />
          </div>

          <div className="flex gap-4 justify-end">
            <button
              onClick={() => revisarSolicitud(true)}
              disabled={enviando}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-semibold flex items-center gap-2"
            >
              {enviando ? <Loader2 size={18} className="animate-spin" /> : "✅ Aprobar"}
            </button>
            <button
              onClick={() => revisarSolicitud(false)}
              disabled={enviando}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-semibold flex items-center gap-2"
            >
              {enviando ? <Loader2 size={18} className="animate-spin" /> : "❌ Devolver"}
            </button>
          </div>
        </div>
      )}

      {pestana === "trazabilidad" && (
        <div className="bg-white border rounded-xl p-6 shadow-md max-w-6xl mx-auto">
          <h3 className="text-lg font-bold text-gray-800 mb-4">🕓 Trazabilidad</h3>
          <ol className="relative border-l border-blue-400 ml-4 space-y-8">
            {trazabilidad.length > 0 ? (
              trazabilidad.map((item, index) => (
                <li key={index} className="ml-4">
                  <div className="absolute -left-[0.7rem] w-4 h-4 bg-blue-600 rounded-full border border-white shadow" />
                  <time className="block mb-1 text-sm text-gray-500">
                    {dayjs(item.fecha).format("DD/MM/YYYY HH:mm")}
                  </time>
                  <p className="text-base font-semibold text-blue-700 mb-1">
                    {item.evento}
                  </p>
                  {(item.usuario_remitente || item.usuario_destinatario) && (
                    <p className="text-sm text-gray-600">
                      {item.usuario_remitente && <span><strong>De:</strong> {item.usuario_remitente}</span>}{" "}
                      {item.usuario_destinatario && <span>→ <strong>Para:</strong> {item.usuario_destinatario}</span>}
                    </p>
                  )}
                  {item.mensaje && (
                    <p className="text-gray-700 bg-gray-100 border rounded p-3 whitespace-pre-wrap">
                      {item.mensaje}
                    </p>
                  )}
                </li>
              ))
            ) : (
              <p className="text-gray-500 italic">No hay eventos registrados.</p>
            )}
          </ol>
        </div>
      )}
    </div>
  );
}

export default DetalleRevisor;
