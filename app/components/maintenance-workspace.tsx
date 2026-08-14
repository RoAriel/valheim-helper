"use client";

import type { RefObject } from "react";
import { manifest } from "@/data/catalog";
import { updateCandidates } from "@/data/update-candidates";

type Props = {
  loading: boolean;
  onCheckUpdates: () => void;
  onOpenReview: () => void;
  updateButtonRef: RefObject<HTMLButtonElement | null>;
};

export function MaintenanceWorkspace({ loading, onCheckUpdates, onOpenReview, updateButtonRef }: Props) {
  const pending = updateCandidates.candidates.filter((entry) => entry.reviewStatus === "pending").length;
  return <section className="field-maintenance" aria-labelledby="maintenance-title">
    <header className="field-maintenance-header">
      <div><p className="eyebrow">ADMINISTRACIÓN LOCAL</p><h1 id="maintenance-title">Mantenimiento</h1><p>Comprobá versiones y consultá el inventario editorial sin modificar automáticamente el catálogo instalado.</p></div>
      <div className="field-review-meta"><small>Valheim cubierto</small><strong>{manifest.gameVersion}</strong><span>Datos actualizados {new Date(`${manifest.dataUpdatedAt}T00:00:00Z`).toLocaleDateString("es")}</span></div>
    </header>
    <div className="field-maintenance-grid">
      <article>
        <p className="eyebrow">VERSIONES</p>
        <h2>Buscar actualizaciones</h2>
        <p>Consulta Steam, Jötunn y GitHub. El diagnóstico es de solo lectura y no cambia los datos instalados.</p>
        <dl><div><dt>Aplicación</dt><dd>{manifest.appVersion}</dd></div><div><dt>Catálogo</dt><dd>{manifest.catalogVersion}</dd></div><div><dt>Valheim</dt><dd>{manifest.gameVersion}</dd></div></dl>
        <button ref={updateButtonRef} className="field-maintenance-action" onClick={onCheckUpdates} disabled={loading}>{loading ? "Comprobando…" : "Comprobar ahora"}</button>
      </article>
      <article>
        <p className="eyebrow">INVENTARIO EDITORIAL</p>
        <h2>Revisión de datos</h2>
        <p>Explorá entradas externas clasificadas que todavía no forman parte confirmada del catálogo disponible.</p>
        <strong className="field-maintenance-count">{pending}<small>pendientes</small></strong>
        <button className="field-maintenance-action secondary" onClick={onOpenReview}>Abrir revisión de datos →</button>
      </article>
    </div>
    <p className="field-maintenance-note"><strong>Uso ocasional.</strong> El catálogo continúa siendo la pantalla principal de consulta durante una partida.</p>
  </section>;
}
