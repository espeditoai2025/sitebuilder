"use client";

import { useState } from "react";
import { RefreshCw, Sparkles } from "lucide-react";

export function GenerateButton({ projectId }: { projectId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setLoading(true);
    setError("");

    const response = await fetch(`/api/projects/${projectId}/generate`, {
      method: "POST"
    });

    if (!response.ok) {
      setLoading(false);
      setError("Generazione non riuscita. Controlla URL e configurazione.");
      return;
    }

    window.location.reload();
  }

  return (
    <div>
      <button className="button" disabled={loading} onClick={generate} type="button">
        {loading ? <RefreshCw size={18} /> : <Sparkles size={18} />}
        {loading ? "Genero..." : "Genera analisi e proposte"}
      </button>
      {error ? <p className="notice">{error}</p> : null}
    </div>
  );
}
