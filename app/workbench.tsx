"use client";

import { useMemo, useRef, useState, type CSSProperties, type Ref } from "react";
import {
  biomes,
  buildGoalPlan,
  buildUpgradeCostSummaries,
  byId,
  foodEffects,
  items,
  manifest,
  materials,
  recipes,
  sources,
  stations,
  subcategories,
} from "@/data/catalog";
import { filterCatalogItems, resolveSelectedItem, type CatalogCategory, type FoodFocus } from "@/data/catalog-filters";
import type { UpdateDiagnosis } from "@/data/update-check";

const categories: CatalogCategory[] = ["Todos", "Armas", "Herramientas", "Construcción", "Comida", "Defensa"];

function themeForBiome(biomeId: string) {
  const biome = byId(biomes, biomeId)!;
  return {
    biome,
    style: { "--biome-accent": biome.theme.accent, "--biome-surface": biome.theme.surface } as CSSProperties,
  };
}

function namesForMaterials(materialIds: string[]) {
  const biomeIds = new Set<string>();
  materialIds.forEach((materialId) => {
    byId(materials, materialId)?.sourceIds.forEach((sourceId) => {
      byId(sources, sourceId)?.biomeIds.forEach((biomeId) => biomeIds.add(biomeId));
    });
  });
  return biomes.filter((biome) => biomeIds.has(biome.id));
}

export default function Workbench() {
  const [biomeId, setBiomeId] = useState("all");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CatalogCategory>("Todos");
  const [subcategoryId, setSubcategoryId] = useState("all");
  const [foodFocus, setFoodFocus] = useState<FoodFocus>("all");
  const [selectedId, setSelectedId] = useState(items[0].id);
  const [updateDiagnosis, setUpdateDiagnosis] = useState<UpdateDiagnosis | null>(null);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const detailRef = useRef<HTMLElement>(null);

  const filteredItems = useMemo(
    () => filterCatalogItems({ biomeId, query, category, subcategoryId, foodFocus }),
    [biomeId, category, foodFocus, query, subcategoryId],
  );
  const availableSubcategories = category === "Todos" ? [] : subcategories.filter((subcategory) => subcategory.category === category);
  const selected = resolveSelectedItem(filteredItems, selectedId);

  function clearFilters() {
    setBiomeId("all");
    setQuery("");
    setCategory("Todos");
    setSubcategoryId("all");
    setFoodFocus("all");
  }

  function selectCategory(nextCategory: CatalogCategory) {
    setCategory(nextCategory);
    setSubcategoryId("all");
    if (nextCategory !== "Comida") setFoodFocus("all");
  }

  function selectItem(itemId: string) {
    setSelectedId(itemId);
    if (window.matchMedia("(max-width: 780px)").matches) {
      requestAnimationFrame(() => detailRef.current?.scrollIntoView({ block: "start" }));
    }
  }

  async function checkUpdates() {
    setUpdateOpen(true);
    setUpdateLoading(true);
    setUpdateError("");
    try {
      const response = await fetch("/api/update-status", { cache: "no-store" });
      if (!response.ok) throw new Error(`El servidor respondió HTTP ${response.status}`);
      setUpdateDiagnosis(await response.json() as UpdateDiagnosis);
    } catch (error) {
      setUpdateError(error instanceof Error ? error.message : "No se pudo completar el diagnóstico");
    } finally {
      setUpdateLoading(false);
    }
  }

  return (
    <main className="field-sample">
      <header className="field-topbar">
        <span className="field-brand">VALHEIM <b>HELPER</b></span>
        <div className="field-topbar-title">
          <span>MESA DE TRABAJO</span>
          <strong>Recetas, progreso y planificación</strong>
        </div>
        <div className="field-update-control">
          <small>Valheim {manifest.gameVersion}</small>
          <button onClick={checkUpdates} disabled={updateLoading}>{updateLoading ? "Comprobando…" : "Buscar actualizaciones"}</button>
        </div>
      </header>

      {updateOpen && <UpdatePanel diagnosis={updateDiagnosis} loading={updateLoading} error={updateError} onRetry={checkUpdates} onClose={() => setUpdateOpen(false)} />}

      <section className="field-layout">
        <nav className="field-progression" aria-label="Progresión por bioma">
          <div className="field-progression-intro">
            <p className="eyebrow">PROGRESIÓN</p>
            <h1>Tu ruta vikinga</h1>
            <p>Elegí una etapa para acotar el catálogo.</p>
          </div>
          <button className={biomeId === "all" ? "active" : ""} aria-pressed={biomeId === "all"} onClick={() => setBiomeId("all")}>
            <span>Todos</span><b>{items.length}</b>
          </button>
          <div className="field-biome-list">
            {biomes.filter((biome) => items.some((item) => item.stageBiomeId === biome.id)).map((biome) => {
              const count = items.filter((item) => item.stageBiomeId === biome.id).length;
              const stationNames = Array.from(new Set(
                items
                  .filter((item) => item.stageBiomeId === biome.id)
                  .map((item) => recipes.find((entry) => entry.itemId === item.id)?.stationId)
                  .filter(Boolean),
              )).slice(0, 2).map((stationId) => byId(stations, stationId!)?.name.es).filter(Boolean);
              const { style } = themeForBiome(biome.id);

              return (
                <button key={biome.id} style={style} className={biomeId === biome.id ? "active" : ""} aria-pressed={biomeId === biome.id} onClick={() => setBiomeId(biome.id)}>
                  <i>{biome.theme.symbol}</i>
                  <span>{biome.name.es}<small>{biome.name.en} · {stationNames.join(" / ")}</small></span>
                  <b>{count}</b>
                </button>
              );
            })}
          </div>
        </nav>

        <section className="field-catalog" aria-label="Catálogo en modo planificación">
          <header>
            <p className="eyebrow">MODO PLANIFICAR</p>
            <h2>¿Qué querés preparar?</h2>
            <label className="field-search">
              <span aria-hidden="true">⌕</span>
              <input aria-label="Buscar por objeto o nombre en inglés" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por objeto o nombre en inglés…" />
            </label>
            <div className="field-filter-row" role="group" aria-label="Filtrar por categoría">
              {categories.map((value) => (
                <button key={value} className={category === value ? "active" : ""} aria-pressed={category === value} onClick={() => selectCategory(value)}>{value}</button>
              ))}
            </div>
            {availableSubcategories.length > 0 && (
              <div className="field-subfilter-row" role="group" aria-label={`Filtrar ${category}`}>
                <span>{category}</span>
                <button className={subcategoryId === "all" ? "active" : ""} aria-pressed={subcategoryId === "all"} onClick={() => setSubcategoryId("all")}>Todas</button>
                {availableSubcategories.map((subcategory) => (
                  <button key={subcategory.id} className={subcategoryId === subcategory.id ? "active" : ""} aria-pressed={subcategoryId === subcategory.id} onClick={() => setSubcategoryId(subcategory.id)}>{subcategory.name.es}</button>
                ))}
              </div>
            )}
            {category === "Comida" && (
              <label className="field-food-filter">
                <span>BENEFICIO</span>
                <select value={foodFocus} onChange={(event) => setFoodFocus(event.target.value as FoodFocus)}>
                  <option value="all">Todos los beneficios</option><option value="health">Prioriza salud</option><option value="healing">Curación</option><option value="resistance">Resistencia</option><option value="stamina">Prioriza aguante</option><option value="eitr">Aporta eitr</option><option value="mobility">Movilidad</option>
                </select>
              </label>
            )}
            <div className="field-summary">
              <span>{filteredItems.length} objetos</span>
              <span>Lista compacta · estación · bioma</span>
              <button className="field-clear" onClick={clearFilters}>Limpiar filtros</button>
            </div>
          </header>
          <div className="field-item-list">
            {filteredItems.map((item) => {
              const { biome, style } = themeForBiome(item.stageBiomeId);
              const itemRecipe = recipes.find((entry) => entry.itemId === item.id)!;
              return (
                <button key={item.id} style={style} className={selected?.id === item.id ? "selected" : ""} aria-pressed={selected?.id === item.id} onClick={() => selectItem(item.id)}>
                  <span className="field-item-icon">{item.icon}</span>
                  <span className="field-item-name"><strong>{item.name.es}</strong><small>{item.name.en}</small></span>
                  <span className="field-row-meta"><small>ESTACIÓN</small>{byId(stations, itemRecipe.stationId)?.name.es}</span>
                  <span className="field-row-biome">{biome.theme.symbol} {biome.name.es}</span><b>›</b>
                </button>
              );
            })}
            {!filteredItems.length && <p className="field-empty">No hay objetos que coincidan con estos filtros.</p>}
          </div>
        </section>

        {selected ? <ItemDetail itemId={selected.id} detailRef={detailRef} /> : <aside ref={detailRef} className="field-detail field-detail-empty" aria-label="Sin objeto seleccionado"><p className="eyebrow">SIN RESULTADOS</p><h2>Ajustá la búsqueda</h2><p>Probá con otro término o limpiá los filtros para volver al catálogo completo.</p><button onClick={clearFilters}>Limpiar filtros</button></aside>}
      </section>
    </main>
  );
}

function UpdatePanel({ diagnosis, loading, error, onRetry, onClose }: { diagnosis: UpdateDiagnosis | null; loading: boolean; error: string; onRetry: () => void; onClose: () => void }) {
  const statusLabel = diagnosis?.status === "current" ? "Información al día" : diagnosis?.status === "review-recommended" ? "Revisión recomendada" : "Diagnóstico incompleto";
  return <section className="field-update-panel" role="dialog" aria-modal="true" aria-labelledby="update-title">
    <header>
      <div><p className="eyebrow">ESTADO DE DATOS</p><h2 id="update-title">Actualizaciones</h2></div>
      <button className="field-update-close" onClick={onClose} aria-label="Cerrar estado de actualizaciones">×</button>
    </header>
    {loading && <p className="field-update-loading">Consultando fuentes oficiales y técnicas…</p>}
    {!loading && error && <div className="field-update-message error"><strong>No se pudo consultar</strong><p>{error}</p><button onClick={onRetry}>Reintentar</button></div>}
    {!loading && diagnosis && <>
      <div className={`field-update-verdict ${diagnosis.status}`}><strong>{statusLabel}</strong><p>{diagnosis.recommendation}</p></div>
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
      <footer>Comprobado: {new Date(diagnosis.checkedAt).toLocaleString("es")}. Este diagnóstico no modifica los JSON ni el contenedor.</footer>
    </>}
  </section>;
}

function ItemDetail({ itemId, detailRef }: { itemId: string; detailRef: Ref<HTMLElement> }) {
  const selected = byId(items, itemId)!;
  const { biome: selectedBiome, style: theme } = themeForBiome(selected.stageBiomeId);
  const recipe = recipes.find((entry) => entry.itemId === selected.id)!;
  const goalPlan = buildGoalPlan(selected.id);
  const collectionBiomes = namesForMaterials(goalPlan.materials.map((cost) => cost.materialId));
  const foodEffect = foodEffects.find((effect) => effect.itemId === selected.id);
  const upgradeCosts = buildUpgradeCostSummaries(recipe);

  return (
    <aside ref={detailRef} className="field-detail" style={theme} aria-label={`Detalle de ${selected.name.es}`}>
      <header>
        <span className="field-detail-icon">{selected.icon}</span>
        <div><p className="eyebrow">{selected.category} · {selectedBiome.theme.symbol} {selectedBiome.name.es}</p><h2>{selected.name.es}</h2><small>{selected.name.en}</small><p>{selected.description}</p></div>
      </header>
      {foodEffect && <section className="field-block field-properties" aria-label="Propiedades del consumible">
        <div className="field-block-title"><h3>Propiedades</h3><span>{formatDuration(foodEffect.durationSeconds)}</span></div>
        <div className="field-stat-grid">
          {foodEffect.health && <Stat label="Salud" value={foodEffect.health} />}
          {foodEffect.stamina && <Stat label="Aguante" value={foodEffect.stamina} />}
          {foodEffect.eitr && <Stat label="Eitr" value={foodEffect.eitr} />}
          {foodEffect.healing && <Stat label="Curación" value={`${foodEffect.healing}/tick`} />}
        </div>
        {foodEffect.effects?.length && <ul className="field-effects">{foodEffect.effects.map((effect) => <li key={effect}>{effect}</li>)}</ul>}
      </section>}
      <section className="field-block"><div className="field-block-title"><h3>Fabricación</h3><span>{byId(stations, recipe.stationId)?.name.es}</span></div>
        {(recipe.outputAmount ?? 1) > 1 && <p className="field-output">Produce <strong>×{recipe.outputAmount}</strong></p>}
        {recipe.craft.materials.map((cost) => <Cost key={cost.materialId} materialId={cost.materialId} amount={cost.amount} />)}
      </section>
      {recipe.upgrades.length > 0 && <details className="field-block field-disclosure"><summary>Mejoras disponibles <span>{recipe.upgrades.length} niveles</span></summary>
        <section className="field-upgrade-total" aria-label={`Costo total desde nivel 1 hasta nivel ${upgradeCosts.at(-1)?.targetLevel}`}>
          <div><p>Costo total acumulado</p><strong>Nivel 1 → Nivel {upgradeCosts.at(-1)?.targetLevel}</strong></div>
          {upgradeCosts.at(-1)?.cumulative.map((cost) => <Cost key={`maximum-${cost.materialId}`} materialId={cost.materialId} amount={cost.amount} />)}
        </section>
        {upgradeCosts.map((upgrade) => <section className="field-upgrade" key={upgrade.targetLevel}>
          <h4>Mejora a nivel {upgrade.targetLevel}</h4>
          <p>Costo de este nivel</p>
          {upgrade.step.map((cost) => <Cost key={`step-${cost.materialId}`} materialId={cost.materialId} amount={cost.amount} />)}
        </section>)}
      </details>}
      <details className="field-block field-plan field-disclosure"><summary>Plan de objetivo <span>Materias primas</span></summary>
        <div className="field-tags">{goalPlan.stationIds.map((stationId) => <span key={stationId}>⚒ {byId(stations, stationId)?.name.es}</span>)}</div>
        <div className="field-tags">{collectionBiomes.map((biome) => <span key={biome.id}>⌖ {biome.name.es}</span>)}</div>
        {goalPlan.materials.map((cost) => <Cost key={cost.materialId} materialId={cost.materialId} amount={cost.amount} />)}
      </details>
    </aside>
  );
}

function Cost({ materialId, amount }: { materialId: string; amount: number }) {
  const material = byId(materials, materialId)!;
  const materialSources = material.sourceIds.map((sourceId) => byId(sources, sourceId)).filter((source) => source !== undefined);
  return <details className="field-cost-detail">
    <summary className="field-cost"><span>{material.icon}</span><span><strong>{material.name.es}</strong><small>{material.name.en}</small></span><b>×{amount}</b></summary>
    <div className="field-source-list">
      {materialSources.map((source) => <div key={source.id}>
        <strong>{source.name.es}</strong><small>{source.name.en}</small>
        <span>{source.biomeIds.map((biomeId) => byId(biomes, biomeId)?.name.es).filter(Boolean).join(" · ")}</span>
        {source.requirement && <em>Requisito: {source.requirement}</em>}
      </div>)}
    </div>
  </details>;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div><small>{label}</small><strong>{value}</strong></div>;
}

function formatDuration(seconds?: number) {
  if (!seconds) return "Duración no especificada";
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder ? `${minutes} min ${remainder} s` : `${minutes} min`;
}
