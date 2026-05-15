"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, RefreshCw, Search, Sparkles, Wand2 } from "lucide-react";

const steps = [
  { label: "Scraping sito", description: "Recupero testi, pagine interne e immagini utili.", icon: Search },
  { label: "Analisi AI", description: "Studio stile, contenuti e identita attuale.", icon: Sparkles },
  { label: "Anteprime HTML", description: "Creo due homepage rinnovate con visual e sezioni reali.", icon: Wand2 },
  { label: "Salvataggio", description: "Preparo le proposte nella dashboard.", icon: CheckCircle2 }
];

export function GenerateButton({ projectId }: { projectId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!loading) {
      return;
    }

    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const nextProgress = Math.min(92, Math.round((elapsed / 52000) * 100));

      setProgress(nextProgress);
      setActiveStep(Math.min(steps.length - 1, Math.floor(nextProgress / 25)));
    }, 600);

    return () => window.clearInterval(interval);
  }, [loading]);

  async function generate() {
    setLoading(true);
    setError("");
    setActiveStep(0);
    setProgress(8);

    const response = await fetch(`/api/projects/${projectId}/generate`, {
      method: "POST"
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setLoading(false);
      setProgress(0);
      setError(data?.error || "Generazione non riuscita. Controlla URL e configurazione.");
      return;
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
