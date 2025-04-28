import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, FileDown } from "lucide-react";

function DetalleConsultaPQRSD() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [solicitud, setSolicitud] = useState(null);
  const [trazabilidad, setTrazabilidad] = useState([]);
  const [pestana, setPestana] = useState("datos");
  const token = localStorage.getItem("token");

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
      } catch (error) {
        console.error("Error al obtener la solicitud:", error);
      }
    };
    fetchData();
  }, [id, token]);

  const badgeEstado = (estado) => {
    const colores = {
      Pendiente: "text-orange-700",
      Asignado: "text-blue-700",
      "En proceso": "text-purple-700",
      Firmado: "text-green-700",
      "Para notificar": "text-gray-700",
      Terminado: "text-gray-800",
      Respondido: "text-teal-700",
      Devuelto: "text-red-700",
    };
    return colores[estado] || "text-slate-700";
  };

  if (!solicitud) return <div className="p-6">Cargando...</div>;

  const fecha = new Date(solicitud.fecha_creacion);

  return (
    <div className="p-6">
      <button
        onClick={() => navigate("/consultor")}
        className="mb-4 text-blue-700 flex items-center gap-2 text-sm hover:underline"
      >
        <ArrowLeft size={16} />
        Volver al consultor
      </button>

      <h2 className="text-2xl font-bold text-blue-800 mb-4">Detalle de la PQRSD</h2>

      {/* RESUMEN PRINCIPAL */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border shadow rounded-lg p-4 flex items-center gap-4">
          <div className="bg-blue-100 p-2 rounded-full">
            <span className="text-blue-700 font-bold">📄</span>
          </div>
          <div>
            <p className="text-xs text-gray-500">Radicado</p>
            <p className="text-base font-semibold text-blue-800">{solicitud.radicado}</p>
          </div>
        </div>

        <div className="bg-white border shadow rounded-lg p-4 flex items-center gap-4">
          <div className="bg-green-100 p-2 rounded-full">
            <span className="text-green-700 font-bold">🗓</span>
          </div>
          <div>
            <p className="text-xs text-gray-500">Fecha de radicación</p>
            <p className="text-base font-semibold text-green-800">
              {fecha.toLocaleDateString("es-CO", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="bg-white border shadow rounded-lg p-4 flex items-center gap-4">
          <div className="bg-purple-100 p-2 rounded-full">
            <span className="text-purple-700 font-bold">🏷️</span>
          </div>
          <div>
            <p className="text-xs text-gray-500">Estado</p>
            <p className={`text-base font-semibold ${badgeEstado(solicitud.estado)}`}>
              {solicitud.estado}
            </p>
          </div>
        </div>
      </div>

      {/* PESTAÑAS */}
      <div className="flex gap-4 border-b mb-6">
        {["datos", "pqrsd", "archivos", "trazabilidad"].map((key) => (
          <button
            key={key}
            onClick={() => setPestana(key)}
            className={`px-4 py-2 font-semibold border-b-4 ${
              pestana === key
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-gray-500 hover:text-blue-600"
            }`}
          >
            {key === "datos" && "Datos del Peticionario"}
            {key === "pqrsd" && "PQRSD"}
            {key === "archivos" && "Archivos Anexos"}
            {key === "trazabilidad" && "Trazabilidad"}
          </button>
        ))}
      </div>

      {/* DATOS DEL PETICIONARIO */}
      {pestana === "datos" && (
        <div className="bg-white border rounded-xl p-6 shadow-md space-y-2 max-w-3xl mx-auto text-sm">
          <p><strong>Nombre:</strong> {solicitud.nombre} {solicitud.apellido}</p>
          <p><strong>Correo:</strong> {solicitud.correo}</p>
          <p><strong>Teléfono:</strong> {solicitud.celular}</p>
          <p><strong>Dirección:</strong> {solicitud.direccion}</p>
          <p><strong>Municipio - Departamento:</strong> {solicitud.municipio}, {solicitud.departamento}</p>
          <p><strong>Fecha:</strong> {fecha.toLocaleDateString()} {fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      )}

      {/* MENSAJE DEL PETICIONARIO */}
      {pestana === "pqrsd" && (
        <div className="bg-white border rounded-xl p-6 shadow-md max-w-6xl mx-auto space-y-6">
          <div>
            <p className="text-sm font-semibold mb-2">📬 Mensaje del ciudadano:</p>
            <div className="bg-gray-50 border border-gray-300 p-3 rounded text-sm whitespace-pre-wrap">
              {solicitud.mensaje}
            </div>
          </div>
        </div>
      )}

      {/* ARCHIVOS ANEXOS */}
      {pestana === "archivos" && (
        <div className="bg-white border rounded-xl p-6 shadow-md max-w-5xl mx-auto">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">📂 Archivos Anexos</h3>
          <table className="min-w-full text-sm">
            <thead className="bg-blue-800 text-white">
              <tr>
                <th className="px-4 py-2 text-left">Nombre del archivo</th>
                <th className="px-4 py-2 text-left">Anexado por</th>
                <th className="px-4 py-2 text-left">Acción</th>
              </tr>
            </thead>
            <tbody className="bg-white text-gray-700">
              {solicitud.archivo && (
                <tr className="border-b hover:bg-blue-50">
                  <td className="px-4 py-2">Archivo del Ciudadano</td>
                  <td className="px-4 py-2">Ciudadano</td>
                  <td className="px-4 py-2">
                    <a
                      href={`${import.meta.env.VITE_API_URL}/${solicitud.archivo}`}
                      download
                      className="text-blue-600 hover:underline inline-flex items-center"
                    >
                      <FileDown size={16} className="mr-1" /> Descargar
                    </a>
                  </td>
                </tr>
              )}
              {solicitud.archivo_respuesta && (
                <tr className="border-b hover:bg-blue-50">
                  <td className="px-4 py-2">Proyecto de Respuesta</td>
                  <td className="px-4 py-2">Responsable</td>
                  <td className="px-4 py-2">
                    <a
                      href={`${import.meta.env.VITE_API_URL}/${solicitud.archivo_respuesta}`}
                      download
                      className="text-blue-600 hover:underline inline-flex items-center"
                    >
                      <FileDown size={16} className="mr-1" /> Descargar
                    </a>
                  </td>
                </tr>
              )}
              {solicitud.archivo_evidencia && (
                <tr className="border-b hover:bg-blue-50">
                  <td className="px-4 py-2">Evidencia de Notificación</td>
                  <td className="px-4 py-2">Administrador</td>
                  <td className="px-4 py-2">
                    <a
                      href={`${import.meta.env.VITE_API_URL}/${solicitud.archivo_evidencia}`}
                      download
                      className="text-blue-600 hover:underline inline-flex items-center"
                    >
                      <FileDown size={16} className="mr-1" /> Descargar
                    </a>
                  </td>
                </tr>
              )}
              {!solicitud.archivo && !solicitud.archivo_respuesta && !solicitud.archivo_evidencia && (
                <tr>
                  <td colSpan="3" className="px-4 py-6 text-center text-gray-400">
                    No hay archivos anexados a esta solicitud.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TRAZABILIDAD */}
      {pestana === "trazabilidad" && (
        <div className="bg-white border rounded-xl p-6 shadow-md max-w-6xl mx-auto">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">📌 Trazabilidad del Proceso</h3>
          <ol className="relative border-l border-blue-600 ml-4 space-y-8 text-sm">
            {trazabilidad.length > 0 ? (
              trazabilidad.map((item, i) => (
                <li key={i} className="ml-4">
                  <div className="absolute -left-[0.7rem] w-4 h-4 bg-blue-600 rounded-full border border-white shadow" />
                  <time className="block mb-1 text-sm text-gray-500">
                    {new Date(item.fecha).toLocaleString()}
                  </time>
                  <p className="text-base font-semibold text-blue-700 mb-1">
                    {item.evento}
                  </p>
                  {(item.usuario_remitente || item.usuario_destinatario) && (
                    <p className="text-xs text-gray-600">
                      {item.usuario_remitente && <span><strong>De:</strong> {item.usuario_remitente}</span>}{" "}
                      {item.usuario_destinatario && <span>→ <strong>Para:</strong> {item.usuario_destinatario}</span>}
                    </p>
                  )}
                  {item.mensaje && (
                    <p className="text-gray-700 bg-gray-100 border rounded p-3 whitespace-pre-wrap mt-2">
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

export default DetalleConsultaPQRSD;
