"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ImageIcon, RefreshCw, Search, Sparkles } from "lucide-react";

const steps = [
  { label: "Scraping sito", description: "Recupero testi, pagine interne e immagini utili.", icon: Search },
  { label: "Analisi AI", description: "Studio stile, contenuti e identita attuale.", icon: Sparkles },
  { label: "Generazione proposte", description: "Creo due direzioni di restyling personalizzate.", icon: Sparkles },
  { label: "Anteprima immagine", description: "Genero il mockup visivo della homepage.", icon: ImageIcon },
  { label: "Completato", description: "Proposte e anteprima pronte.", icon: CheckCircle2 }
];

// step 0-2 = /generate (~30s), step 3 = /generate-image (~40s)
const IMAGE_STEP = 3;
const TOTAL_MS = 75000;

export function GenerateButton({ projectId }: { projectId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!loading) return;

    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const nextProgress = Math.min(94, Math.round((elapsed / TOTAL_MS) * 100));
      setProgress(nextProgress);
      setActiveStep(Math.min(steps.length - 1, Math.floor((nextProgress / 100) * steps.length)));
    }, 600);

    return () => window.clearInterval(interval);
  }, [loading]);

  async function generate() {
    setLoading(true);
    setError("");
    setActiveStep(0);
    setProgress(4);

    const res = await fetch(`/api/projects/${projectId}/generate`, { method: "POST" });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setLoading(false);
      setProgress(0);
      setError(data?.error || "Generazione non riuscita. Controlla URL e configurazione.");
      return;
    }

    setActiveStep(IMAGE_STEP);

    const imgRes = await fetch(`/api/projects/${projectId}/generate-image`, { method: "POST" });

    if (!imgRes.ok) {
      // image failed but proposals are ready — reload anyway
      console.warn("Image generation failed, loading proposals without preview.");
    }

    setProgress(100);
    setActiveStep(steps.length - 1);
    window.location.reload();
  }

  return (
    <div className="generation-panel">
      <button className="button" disabled={loading} onClick={generate} type="button">
        {loading ? <RefreshCw size={18} /> : <Sparkles size={18} />}
        {loading ? "Generazione in corso" : "Genera analisi e proposte"}
      </button>
      {loading ? (
        <div className="progress-card" aria-live="polite">
          <div className="progress-head">
            <span>{steps[activeStep].label}</span>
            <strong>{progress}%</strong>
          </div>
          <div className="progress-track">
            <span style={{ width: `${progress}%` }} />
          </div>
          <div className="progress-steps">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isDone = index < activeStep;
              const isActive = index === activeStep;
              return (
                <div className={`progress-step ${isDone ? "done" : ""} ${isActive ? "active" : ""}`} key={step.label}>
                  <Icon size={18} />
                  <div>
                    <strong>{step.label}</strong>
                    <p>{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
      {error ? <p className="notice">{error}</p> : null}
    </div>
  );
}
