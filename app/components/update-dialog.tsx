"use client";

import { useEffect, useRef, type RefObject } from "react";
import type { UpdateDiagnosis } from "@/data/update-check";

type Props = {
  diagnosis: UpdateDiagnosis | null;
  loading: boolean;
  error: string;
  onRetry: () => void;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
};

export function UpdateDialog({ diagnosis, loading, error, onRetry, onClose, returnFocusRef }: Props) {
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const returnFocusElement = returnFocusRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? []);
    focusable()[0]?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const controls = focusable();
      if (!controls.length) return;
      const first = controls[0];
      const last = controls.at(-1)!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      returnFocusElement?.focus();
    };
  }, [onClose, returnFocusRef]);

  const statusLabel = diagnosis?.status === "current" ? "Información al día" : diagnosis?.status === "review-recommended" ? "Revisión recomendada" : "Diagnóstico incompleto";
  return <div className="field-update-backdrop">
    <button className="field-update-backdrop-close" tabIndex={-1} aria-label="Cerrar actualizaciones haciendo clic fuera del diálogo" onClick={onClose} />
    <section ref={dialogRef} className="field-update-panel" role="dialog" aria-modal="true" aria-labelledby="update-title" aria-describedby="update-description">
      <header>
        <div><p className="eyebrow">ESTADO DE DATOS</p><h2 id="update-title">Actualizaciones</h2></div>
        <button className="field-update-close" onClick={onClose} aria-label="Cerrar estado de actualizaciones">×</button>
      </header>
      <p id="update-description" className="sr-only">Diagnóstico de versiones y fuentes externas de Valheim Helper.</p>
      {loading && <p className="field-update-loading" role="status">Consultando fuentes oficiales y técnicas…</p>}
      {!loading && error && <div className="field-update-message error" role="alert"><strong>No se pudo consultar</strong><p>{error}</p><button onClick={onRetry}>Reintentar</button></div>}
      {!loading && diagnosis && <>
        <div className={`field-update-verdict ${diagnosis.status}`} role="status"><strong>{statusLabel}</strong><p>{diagnosis.recommendation}</p></div>
        <div className="field-update-versions">
          <div><small>Aplicación instalada</small><strong>{diagnosis.current.appVersion}</strong>{diagnosis.latest.appVersion && <span>Publicada: {diagnosis.latest.appVersion}</span>}</div>
          <div><small>Catálogo instalado</small><strong>{diagnosis.current.catalogVersion}</strong>{diagnosis.latest.catalogVersion && <span>Publicado: {diagnosis.latest.catalogVersion}</span>}</div>
          <div><small>Valheim cubierto</small><strong>{diagnosis.current.gameVersion}</strong>{diagnosis.latest.stableGameVersion && <span>Estable detectada: {diagnosis.latest.stableGameVersion}</span>}</div>
        </div>
        <div className="field-update-sources">
          {diagnosis.sources.map((source) => <a key={source.id} href={source.url} target="_blank" rel="noreferrer">
            <span className={source.status}>{source.status === "available" ? "✓" : "!"}</span>
            <span><strong>{source.label}</strong><small>{source.detail}</small></span>
          </a>)}
        </div>
        <footer>Comprobado: {new Date(diagnosis.checkedAt).toLocaleString("es")}. Este diagnóstico no cambia los datos instalados.</footer>
      </>}
    </section>
  </div>;
}
