"use client";

import { useState } from "react";

export default function Demo() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const runBackgroundJob = async () => {
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/demo/background", {
        method: "POST",
      });

      const data = await res.json();
      setStatus(data.status); // "started"
    } catch (err) {
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Inngest Non-Blocking Demo</h2>

      <button
        onClick={runBackgroundJob}
        disabled={loading}
        style={{
          padding: "10px 16px",
          background: "#000",
          color: "#fff",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        {loading ? "Starting..." : "Generate Recipe (Background)"}
      </button>

      {status && (
        <p style={{ marginTop: "1rem" }}>
          Status: <strong>{status}</strong>
        </p>
      )}
    </div>
  );
}
