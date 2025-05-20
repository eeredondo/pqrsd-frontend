import React, { useState, useEffect } from "react";
import axios from "axios";

function CambiarContrasena() {
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [usuarioId, setUsuarioId] = useState(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("usuario"));
    if (userData) {
      setUsuarioId(userData.id);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!actual || !nueva) {
      setMensaje("❌ Debes completar ambos campos.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${import.meta.env.VITE_API_URL}/usuarios/${usuarioId}/cambiar-contrasena`,
        {
          contrasena_actual: actual,
          nueva_contraseña: nueva,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMensaje("✅ Contraseña actualizada correctamente.");
      setActual("");
      setNueva("");
    } catch (err) {
      setMensaje("❌ Error: contraseña actual incorrecta o problema al actualizar.");
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 mt-10 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Cambiar contraseña</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="Contraseña actual"
          value={actual}
          onChange={(e) => setActual(e.target.value)}
          className="w-full p-2 mb-3 border rounded"
          required
        />
        <input
          type="password"
          placeholder="Nueva contraseña"
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          className="w-full p-2 mb-3 border rounded"
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
        >
          Actualizar contraseña
        </button>
      </form>
      {mensaje && <p className="mt-3 text-sm">{mensaje}</p>}
    </div>
  );
}

export default CambiarContrasena;
