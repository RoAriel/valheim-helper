"use client";

import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent } from "react";
import { biomes, byId, foodEffects, items, manifest, recipes, stations } from "@/data/catalog";

export function AppHeader({ activeView, pending, onSelect, onKeyDown }: { activeView: "catalog" | "maintenance" | "review"; pending: number; onSelect: (view: "catalog" | "maintenance") => void; onKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void }) {
  return <header className="field-topbar"><span className="field-brand">VALHEIM <b>HELPER</b></span><div className="field-view-tabs" role="tablist" aria-label="Secciones de la aplicación" tabIndex={-1} onKeyDown={onKeyDown}>
    <button id="catalog-tab" role="tab" aria-controls="catalog-panel" aria-selected={activeView === "catalog"} tabIndex={activeView === "catalog" ? 0 : -1} className={activeView === "catalog" ? "active" : ""} onClick={() => onSelect("catalog")}>Catálogo</button>
    <button id="maintenance-tab" role="tab" aria-controls="maintenance-panel" aria-selected={activeView !== "catalog"} tabIndex={activeView !== "catalog" ? 0 : -1} className={activeView !== "catalog" ? "active" : ""} onClick={() => onSelect("maintenance")}>Mantenimiento <span>{pending}</span></button>
  </div><small className="field-header-version">Valheim {manifest.gameVersion}</small></header>;
}

export function BiomeNavigation({ selectedId, onSelect }: { selectedId: string; onSelect: (biomeId: string) => void }) {
  return <nav className="field-progression" aria-label="Progresión por bioma"><div className="field-progression-intro"><p className="eyebrow">PROGRESIÓN</p><h1>Tu ruta vikinga</h1><p>Elegí una etapa para acotar el catálogo.</p></div>
    <button className={selectedId === "all" ? "active" : ""} aria-pressed={selectedId === "all"} onClick={() => onSelect("all")}><span>Todos</span><b>{items.length}</b></button>
    <div className="field-biome-list">{biomes.filter((biome) => items.some((item) => item.stageBiomeId === biome.id)).map((biome) => {
      const biomeItems = items.filter((item) => item.stageBiomeId === biome.id);
      const stationNames = Array.from(new Set(biomeItems.map((item) => recipes.find((entry) => entry.itemId === item.id)?.stationId).filter(Boolean))).slice(0, 2).map((stationId) => byId(stations, stationId!)?.name.es).filter(Boolean);
      const style = { "--biome-accent": biome.theme.accent, "--biome-surface": biome.theme.surface } as CSSProperties;
      return <button key={biome.id} style={style} className={selectedId === biome.id ? "active" : ""} aria-pressed={selectedId === biome.id} onClick={() => onSelect(biome.id)}><i aria-hidden="true">{biome.theme.symbol}</i><span>{biome.name.es}<small>{biome.name.en} · {stationNames.join(" / ")}</small></span><b>{biomeItems.length}</b></button>;
    })}</div>
  </nav>;
}

export function ItemList({ entries, selectedId, onSelect }: { entries: typeof items; selectedId?: string; onSelect: (itemId: string) => void }) {
  return <div className="field-item-list">{entries.map((item) => {
    const biome = byId(biomes, item.stageBiomeId)!; const recipe = recipes.find((entry) => entry.itemId === item.id)!;
    const style = { "--biome-accent": biome.theme.accent, "--biome-surface": biome.theme.surface } as CSSProperties;
    return <button key={item.id} style={style} className={selectedId === item.id ? "selected" : ""} aria-pressed={selectedId === item.id} onClick={() => onSelect(item.id)}><span className="field-item-icon" aria-hidden="true">{item.icon}</span><span className="field-item-name"><strong>{item.name.es}</strong><small>{item.name.en}</small>{item.category === "Comida" && <span className="field-item-food-stats">{foodSummary(item.id)}</span>}</span><span className="field-row-meta"><small>ESTACIÓN</small>{byId(stations, recipe.stationId)?.name.es}</span><span className="field-row-biome">{biome.theme.symbol} {biome.name.es}</span><b>›</b></button>;
  })}{!entries.length && <p className="field-empty">No hay objetos que coincidan con estos filtros.</p>}</div>;
}

function formatDuration(seconds?: number) { if (!seconds) return "Duración no especificada"; if (seconds < 60) return `${seconds} s`; const minutes = Math.floor(seconds / 60); const remainder = seconds % 60; return remainder ? `${minutes} min ${remainder} s` : `${minutes} min`; }
function foodSummary(itemId: string) { const effect = foodEffects.find((entry) => entry.itemId === itemId); if (!effect) return "Propiedades no registradas"; return [effect.health ? `Salud ${effect.health}` : "", effect.stamina ? `Aguante ${effect.stamina}` : "", effect.eitr ? `Eitr ${effect.eitr}` : "", formatDuration(effect.durationSeconds)].filter(Boolean).join(" · "); }
