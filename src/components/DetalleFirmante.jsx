import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import dayjs from "dayjs";
import {
  ArrowLeft, FileDown, Mail, User, Phone, MapPin, Send, Upload, CheckCircle2
} from "lucide-react";
import { toast } from "react-toastify";

function DetalleFirmante() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [solicitud, setSolicitud] = useState(null);
  const [trazabilidad, setTrazabilidad] = useState([]);
  const [archivoFirmado, setArchivoFirmado] = useState(null);
  const [pestana, setPestana] = useState("pqrsd");
  const [enviando, setEnviando] = useState(false);
  const [firmado, setFirmado] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/solicitudes/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSolicitud(res.data);

        const traz = await axios.get(
          `${import.meta.env.VITE_API_URL}/solicitudes/${id}/trazabilidad`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTrazabilidad(traz.data);
      } catch (err) {
        console.error("Error al cargar detalles:", err);
      }
    };

    fetchData();
  }, [id, token]);

  const firmarYEnviar = async () => {
    if (!archivoFirmado) {
      toast.warn("⚠️ Debes adjuntar el archivo firmado.", { position: "top-right" });
      return;
    }

    try {
      setEnviando(true);

      const formData = new FormData();
      formData.append("archivo", archivoFirmado);

      await axios.post(
        `${import.meta.env.VITE_API_URL}/solicitudes/${id}/firmar`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("✅ Solicitud firmada correctamente", { position: "top-right" });
      setFirmado(true);
    } catch (error) {
      console.error("Error al firmar:", error);
      toast.error("❌ Error al enviar la solicitud firmada", { position: "top-right" });
    } finally {
      setEnviando(false);
    }
  };

  useEffect(() => {
    if (firmado) {
      setTimeout(() => {
        navigate("/firmante");
      }, 3000);
    }
  }, [firmado, navigate]);

  if (!solicitud) return <div className="p-6">Cargando detalles...</div>;

  if (firmado) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50 px-4">
        <CheckCircle2 size={80} className="text-green-500 mb-4 animate-pulse" />
        <h1 className="text-2xl font-bold text-gray-700 mb-2">¡Solicitud firmada!</h1>
        <p className="text-gray-600 mb-6">
          El radicado <span className="font-semibold">{solicitud.radicado}</span> fue enviado al asignador exitosamente.
        </p>
        <p className="text-sm text-gray-500">Redirigiendo al panel de firmantes...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <button
        onClick={() => navigate("/firmante")}
        className="mb-4 inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold"
      >
        <ArrowLeft size={18} className="mr-1" /> Volver
      </button>

      <h2 className="text-2xl font-bold text-blue-800 mb-6">
        Detalle de Solicitud: {solicitud.radicado}
      </h2>

      {/* PESTAÑAS */}
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

      {/* DATOS DEL PETICIONARIO */}
      {pestana === "datos" && (
        <div className="bg-white border rounded-xl p-6 shadow-md space-y-2 max-w-3xl mx-auto">
          <p><User className="inline mr-2 text-gray-500" /> {solicitud.nombre} {solicitud.apellido}</p>
          <p><Mail className="inline mr-2 text-gray-500" /> {solicitud.correo}</p>
          <p><Phone className="inline mr-2 text-gray-500" /> {solicitud.celular}</p>
          <p><MapPin className="inline mr-2 text-gray-500" /> {solicitud.municipio}, {solicitud.departamento}</p>
        </div>
      )}

      {/* PQRSD */}
      {pestana === "pqrsd" && (
        <div className="bg-white border rounded-xl p-6 shadow-md space-y-6 max-w-6xl mx-auto">
          <div>
            <h3 className="text-sm text-gray-600 font-medium">📎 Archivo del ciudadano:</h3>
            {solicitud.archivo_url ? (
              <iframe
                src={solicitud.archivo_url}
                className="w-full h-[800px] border rounded"
                title="Archivo ciudadano"
              ></iframe>
            ) : (
              <p className="text-red-500 italic">No disponible</p>
            )}
          </div>

          <div>
            <h3 className="text-sm text-gray-600 font-medium">📄 Descargar Word revisado:</h3>
            {solicitud.archivo_respuesta_url ? (
              <a
                href={solicitud.archivo_respuesta_url}
                className="text-blue-600 underline inline-flex items-center"
                target="_blank"
                rel="noopener noreferrer"
                download
              >
                <FileDown className="mr-2" size={18} /> Descargar Word
              </a>
            ) : (
              <p className="text-red-500 italic">No hay Word disponible.</p>
            )}
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-2">📤 Adjuntar archivo firmado (PDF o Word):</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setArchivoFirmado(e.target.files[0])}
              className="border rounded p-2 w-full"
            />
          </div>

          <div className="text-right">
            <button
              onClick={firmarYEnviar}
              disabled={enviando}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-semibold flex items-center gap-2"
            >
              <Send size={16} /> {enviando ? "Enviando..." : "Enviar al Asignador"}
            </button>
          </div>
        </div>
      )}

      {/* TRAZABILIDAD */}
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
                  <p className="text-base font-semibold text-blue-700 mb-1">{item.evento}</p>
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

export default DetalleFirmante;
