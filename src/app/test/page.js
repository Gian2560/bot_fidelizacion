"use client";

// pages/envios.js
import { useState, useEffect } from "react";

export default function EnviosPage() {
  const [loading, setLoading] = useState(false);
  const [tiempo, setTiempo] = useState(0);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    let interval;
    if (loading) {
      setTiempo(0);
      interval = setInterval(() => {
        setTiempo((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const iniciarEnvio = async () => {
    setLoading(true);
    setMensaje("");

    try {
      const res = await fetch(
  "https://envio-meta-763512810578.us-east4.run.app",
  { method: "POST" }
);

      const data = await res.json();
      setMensaje(data.mensaje || "Operación completada");
    } catch (error) {
      setMensaje("Error: " + error.message);
    }

    setLoading(false);
  };

  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <h1>Envío de Mensajes</h1>

      <button
        onClick={iniciarEnvio}
        disabled={loading}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          backgroundColor: loading ? "#ccc" : "#0070f3",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Procesando..." : "Iniciar envío"}
      </button>

      {loading && (
        <div style={{ marginTop: "20px" }}>
          <div
            style={{
              border: "4px solid #f3f3f3",
              borderRadius: "50%",
              borderTop: "4px solid #0070f3",
              width: "40px",
              height: "40px",
              margin: "auto",
              animation: "spin 1s linear infinite",
            }}
          ></div>
          <p>{tiempo} segundos transcurridos</p>
        </div>
      )}

      {mensaje && !loading && (
        <p style={{ marginTop: "20px", fontWeight: "bold" }}>{mensaje}</p>
      )}

      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
