import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, FileDown, CheckCircle2 } from "lucide-react";
import { toast } from "react-toastify";

function DetalleFinalizador() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [solicitud, setSolicitud] = useState(null);
  const [archivo, setArchivo] = useState(null);
  const [finalizado, setFinalizado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const fetchSolicitud = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/solicitudes/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSolicitud(res.data);
      } catch (err) {
        console.error("Error al cargar la solicitud:", err);
      }
    };

    fetchSolicitud();
  }, [id, token]);

  const finalizarSolicitud = async () => {
    if (!archivo) {
      toast.warn("⚠️ Debes subir el archivo de notificación para finalizar", { position: "top-right" });
      return;
    }

    try {
      setEnviando(true);

      const formData = new FormData();
      formData.append("archivo", archivo);

      await axios.post(
        `${import.meta.env.VITE_API_URL}/solicitudes/${id}/finalizar`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      toast.success("✅ Solicitud finalizada correctamente", { position: "top-right" });
      setFinalizado(true);
    } catch (err) {
      console.error("Error al finalizar solicitud:", err);
      toast.error("❌ Hubo un error al finalizar", { position: "top-right" });
    } finally {
      setEnviando(false);
    }
  };

  useEffect(() => {
    if (finalizado) {
      setTimeout(() => {
        navigate("/finalizar");
      }, 3000);
    }
  }, [finalizado, navigate]);

  if (!solicitud) return <div className="p-6">Cargando detalles...</div>;

  if (finalizado) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-gray-50 px-4">
        <CheckCircle2 size={80} className="text-green-500 mb-4 animate-pulse" />
        <h1 className="text-2xl font-bold text-gray-700 mb-2">¡Solicitud finalizada!</h1>
        <p className="text-gray-600 mb-6">
          El radicado <span className="font-semibold">{solicitud.radicado}</span> fue notificado exitosamente.
        </p>
        <p className="text-sm text-gray-500">Redirigiendo al panel de finalización...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <button
        onClick={() => navigate("/finalizar")}
        className="mb-4 inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold"
      >
        <ArrowLeft className="mr-1" size={18} /> Volver
      </button>

      <h2 className="text-2xl font-bold text-blue-800 mb-6">
        Finalizar solicitud: {solicitud.radicado}
      </h2>

      <div className="bg-white p-6 rounded-xl shadow border space-y-6 max-w-4xl mx-auto">
        <div>
          <p className="text-gray-700">
            <strong>Peticionario:</strong> {solicitud.nombre} {solicitud.apellido}
          </p>
          <p className="text-gray-700">
            <strong>Correo:</strong> {solicitud.correo}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-600 font-medium">📎 Archivo firmado:</p>
          {solicitud.archivo_respuesta ? (
            <a
              href={`${import.meta.env.VITE_API_URL}/${solicitud.archivo_respuesta}`}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline inline-flex items-center"
            >
              <FileDown className="mr-2" size={18} /> Descargar archivo firmado
            </a>
          ) : (
            <p className="text-red-500 italic">No hay archivo firmado</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            📤 Adjuntar evidencia de notificación (obligatorio):
          </label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setArchivo(e.target.files[0])}
            className="border p-2 rounded w-full"
          />
        </div>

        <div className="text-right">
          <button
            onClick={finalizarSolicitud}
            disabled={enviando}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-semibold flex items-center gap-2"
          >
            {enviando ? "Finalizando..." : "Finalizar solicitud"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DetalleFinalizador;
