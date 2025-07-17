import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  FileDown, ArrowLeft, Mail, User,
  Phone, MapPin, Send, CheckCircle2, Loader2
} from "lucide-react";
import { toast } from "react-toastify";
import "react-quill/dist/quill.snow.css";

dayjs.extend(relativeTime);

function DetalleResponsable() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [solicitud, setSolicitud] = useState(null);
  const [pestana, setPestana] = useState("pqrsd");
  const [respuesta, setRespuesta] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [trazabilidad, setTrazabilidad] = useState([]);
  const [archivoWord, setArchivoWord] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [respuestaExitosa, setRespuestaExitosa] = useState(false);

  useEffect(() => {
    const fetchSolicitud = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/solicitudes/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSolicitud(res.data);
      } catch (err) {
        console.error("Error al obtener la solicitud:", err);
        navigate("/responsable");
      }
    };

    const fetchTrazabilidad = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/solicitudes/${id}/trazabilidad`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTrazabilidad(res.data);
      } catch (err) {
        console.error("Error al obtener la trazabilidad:", err);
      }
    };

    fetchSolicitud();
    fetchTrazabilidad();
  }, [id, token, navigate]);

  const enviarRespuesta = async () => {
    if (!mensaje.trim()) {
      toast.warn("⚠️ El mensaje para el revisor no puede estar vacío.", {
        position: "top-right",
      });
      return;
    }

    try {
      setEnviando(true);
      const formData = new FormData();
      formData.append("mensaje", mensaje);
      formData.append("contenido", respuesta);
      if (archivoWord) formData.append("archivo", archivoWord);

      await axios.post(
        `${import.meta.env.VITE_API_URL}/solicitudes/${id}/responder`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setRespuestaExitosa(true);
    } catch (error) {
      console.error("Error al enviar la respuesta:", error);
      toast.error("❌ Error al enviar la respuesta.", {
        position: "top-right",
      });
    } finally {
      setEnviando(false);
    }
  };

  useEffect(() => {
    if (respuestaExitosa && solicitud) {
      toast.success(`✅ Respuesta enviada correctamente para ${solicitud.radicado}`, {
        position: "top-right",
        autoClose: 2000,
      });

      setTimeout(() => {
        navigate("/responsable");
      }, 3000);
    }
  }, [respuestaExitosa, solicitud, navigate]);

  if (!solicitud) return <div className="p-6">Cargando solicitud...</div>;

  // Si la respuesta fue enviada, mostrar pantalla de éxito
  if (respuestaExitosa) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50 px-4">
        <CheckCircle2 size={80} className="text-green-500 mb-4 animate-pulse" />
        <h1 className="text-2xl font-bold text-green-700 mb-2">¡Respuesta enviada!</h1>
        <p className="text-gray-700 mb-6 text-center">
          El radicado <span className="font-semibold">{solicitud.radicado}</span> fue enviado al revisor correctamente.
        </p>
        <p className="text-sm text-gray-500">Redirigiendo al panel de responsable...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <button onClick={() => navigate("/responsable")} className="mb-4 inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold">
        <ArrowLeft size={18} className="mr-1" /> Volver
      </button>

      <h2 className="text-2xl font-bold text-blue-800 mb-4">Detalle de Solicitud: {solicitud.radicado}</h2>

      <div className="flex gap-4 border-b mb-6">
        {[
          { key: "datos", label: "Datos del Peticionario" },
          { key: "pqrsd", label: "PQRSD" },
          { key: "trazabilidad", label: "Trazabilidad" }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setPestana(key)}
            className={`px-4 py-2 font-semibold border-b-4 ${pestana === key ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-blue-600"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {pestana === "datos" && (
        <div className="bg-white p-6 rounded-xl shadow-md border max-w-3xl mx-auto space-y-4">
          <p><User className="inline mr-2 text-gray-500" /> {solicitud.nombre} {solicitud.apellido}</p>
          <p><Mail className="inline mr-2 text-gray-500" /> {solicitud.correo}</p>
          <p><Phone className="inline mr-2 text-gray-500" /> {solicitud.celular}</p>
          <p><MapPin className="inline mr-2 text-gray-500" /> {solicitud.municipio}, {solicitud.departamento}</p>
        </div>
      )}

      {pestana === "pqrsd" && (
        <div className="bg-white p-6 rounded-xl shadow-md border max-w-5xl mx-auto space-y-6">
          {solicitud.estado === "Devuelto" && solicitud.revision_comentario && (
            <div className="bg-red-100 border-l-4 border-red-600 p-4 rounded-md shadow-sm">
              <h4 className="text-red-800 font-semibold mb-1 flex items-center gap-2">
                ⚠️ Esta solicitud fue devuelta por el revisor
              </h4>
              <p className="text-sm text-red-700 whitespace-pre-wrap">
                {solicitud.revision_comentario}
              </p>
            </div>
          )}

          <div>
            <h3 className="text-lg font-semibold text-gray-700">📬 Mensaje del ciudadano:</h3>
            <p className="bg-gray-100 p-4 rounded border text-gray-800 whitespace-pre-wrap">{solicitud.mensaje}</p>
            {solicitud.archivo_url && (
              <iframe
                src={`${solicitud.archivo_url}#toolbar=1`}
                className="w-full h-[1000px] border rounded mt-4"
                title="Vista previa archivo ciudadano"
              ></iframe>
            )}
          </div>
          <div>
            <label className="block font-semibold text-gray-700 mb-2">📄 Anexar proyecto de respuesta (.docx):</label>
            <input
              type="file"
              accept=".doc,.docx"
              onChange={(e) => setArchivoWord(e.target.files[0])}
              className="block w-full border rounded p-2"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-2">✉️ Mensaje para el revisor:</label>
            <textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              className="w-full p-3 border rounded resize-none"
              rows={4}
              placeholder="Ej: Por favor revisar con prioridad..."
            />
          </div>

          <div className="text-right">
            <button
              onClick={enviarRespuesta}
              disabled={enviando}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-semibold flex items-center gap-2 justify-center"
            >
              {enviando ? <><Loader2 className="animate-spin" size={18} /> Enviando...</> : <><Send size={16} /> Enviar</>}
            </button>
          </div>
        </div>
      )}

      {pestana === "trazabilidad" && (
        <div className="bg-white p-6 rounded-xl shadow-md border max-w-6xl mx-auto">
          <h3 className="text-lg font-bold text-gray-800 mb-6">📜 Historial de Trazabilidad</h3>
          <ol className="relative border-l border-blue-400 ml-4 space-y-8">
            {trazabilidad.length > 0 ? (
              trazabilidad.map((item, index) => (
                <li key={index} className="ml-4">
                  <div className="absolute -left-[0.7rem] w-4 h-4 bg-blue-600 rounded-full border border-white shadow" />
                  <time className="block mb-1 text-sm font-medium text-gray-500">
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

          <div className="mt-10 pt-6 border-t">
            <h4 className="text-md font-semibold text-gray-700 mb-2">📂 Archivos descargables:</h4>
            <div className="space-y-2">
              {solicitud.archivo && (
                <a
                  href={`${import.meta.env.VITE_API_URL}/${solicitud.archivo}`}
                  className="text-blue-600 hover:underline inline-flex items-center"
                  download
                >
                  <FileDown className="mr-2" size={18} /> Descargar archivo del ciudadano
                </a>
              )}
              {solicitud.archivo_respuesta && (
                <a
                  href={`${import.meta.env.VITE_API_URL}/${solicitud.archivo_respuesta}`}
                  className="text-blue-600 hover:underline inline-flex items-center"
                  download
                >
                  <FileDown className="mr-2" size={18} /> Descargar archivo de respuesta
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DetalleResponsable;
