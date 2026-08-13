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
  stationExtensions,
  stationRequirement,
  stations,
  subcategories,
} from "@/data/catalog";
import { filterCatalogItems, resolveSelectedItem, type CatalogCategory, type FoodFocus, type InfrastructureFocus } from "@/data/catalog-filters";
import type { UpdateDiagnosis } from "@/data/update-check";
import { updateCandidates, type UpdateCandidate } from "@/data/update-candidates";

const categories: CatalogCategory[] = ["Todos", "Armas", "Herramientas", "Construcción", "Comida", "Defensa"];
const candidateClassifications = ["all", "functional_candidate", "probable_alias", "manual_review", "existing_material", "decorative_or_cosmetic", "technical_or_non_catalog"] as const;
const candidateClassificationLabels: Record<(typeof candidateClassifications)[number], string> = {
  all: "Todos", functional_candidate: "Funcionales", probable_alias: "Posibles alias", manual_review: "Revisión manual",
  existing_material: "Materiales existentes", decorative_or_cosmetic: "Decorativos", technical_or_non_catalog: "Técnicos",
};
const candidateFamilyLabels: Record<NonNullable<UpdateCandidate["functionalFamily"]>, string> = {
  equipment: "Equipo", ammunition: "Munición", consumable: "Consumibles", tool: "Herramientas", infrastructure: "Infraestructura",
};

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
  const [activeView, setActiveView] = useState<"catalog" | "review">("catalog");
  const [biomeId, setBiomeId] = useState("all");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CatalogCategory>("Todos");
  const [subcategoryId, setSubcategoryId] = useState("all");
  const [foodFocus, setFoodFocus] = useState<FoodFocus>("all");
  const [infrastructureFocus, setInfrastructureFocus] = useState<InfrastructureFocus>("all");
  const [selectedId, setSelectedId] = useState(items[0].id);
  const [updateDiagnosis, setUpdateDiagnosis] = useState<UpdateDiagnosis | null>(null);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const detailRef = useRef<HTMLElement>(null);

  const filteredItems = useMemo(
    () => filterCatalogItems({ biomeId, query, category, subcategoryId, foodFocus, infrastructureFocus }),
    [biomeId, category, foodFocus, infrastructureFocus, query, subcategoryId],
  );
  const availableSubcategories = category === "Todos" ? [] : subcategories.filter((subcategory) => subcategory.category === category);
  const selected = resolveSelectedItem(filteredItems, selectedId);

  function clearFilters() {
    setBiomeId("all");
    setQuery("");
    setCategory("Todos");
    setSubcategoryId("all");
    setFoodFocus("all");
    setInfrastructureFocus("all");
  }

  function selectCategory(nextCategory: CatalogCategory) {
    setCategory(nextCategory);
    setSubcategoryId("all");
    if (nextCategory !== "Comida") setFoodFocus("all");
    if (nextCategory !== "Construcción") setInfrastructureFocus("all");
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
        <div className="field-view-tabs" role="tablist" aria-label="Secciones de la aplicación">
          <button role="tab" aria-selected={activeView === "catalog"} className={activeView === "catalog" ? "active" : ""} onClick={() => setActiveView("catalog")}>Catálogo</button>
          <button role="tab" aria-selected={activeView === "review"} className={activeView === "review" ? "active" : ""} onClick={() => setActiveView("review")}>
            Revisión de datos <span>{updateCandidates.candidates.filter((entry) => entry.reviewStatus === "pending").length}</span>
          </button>
        </div>
        <div className="field-update-control">
          <small>Valheim {manifest.gameVersion}</small>
          <button onClick={checkUpdates} disabled={updateLoading}>{updateLoading ? "Comprobando…" : "Buscar actualizaciones"}</button>
        </div>
      </header>

      {updateOpen && <UpdatePanel diagnosis={updateDiagnosis} loading={updateLoading} error={updateError} onRetry={checkUpdates} onClose={() => setUpdateOpen(false)} />}

      {activeView === "review" ? <ReviewWorkspace /> : <section className="field-layout">
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
            {category === "Construcción" && (
              <div className="field-subfilter-row" role="group" aria-label="Filtrar construcciones funcionales">
                <span>FUNCIÓN</span>
                <button className={infrastructureFocus === "all" ? "active" : ""} aria-pressed={infrastructureFocus === "all"} onClick={() => setInfrastructureFocus("all")}>Todas</button>
                <button className={infrastructureFocus === "stations_processing" ? "active" : ""} aria-pressed={infrastructureFocus === "stations_processing"} onClick={() => setInfrastructureFocus("stations_processing")}>Estaciones y proceso</button>
              </div>
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
      </section>}
    </main>
  );
}

function ReviewWorkspace() {
  const [query, setQuery] = useState("");
  const [classification, setClassification] = useState<(typeof candidateClassifications)[number]>("all");
  const [family, setFamily] = useState<"all" | NonNullable<UpdateCandidate["functionalFamily"]>>("all");
  const [showResolved, setShowResolved] = useState(false);
  const normalizedQuery = query.trim().toLowerCase();
  const visible = useMemo(() => updateCandidates.candidates.filter((candidate) => {
    if (!showResolved && candidate.reviewStatus !== "pending") return false;
    if (classification !== "all" && candidate.classification !== classification) return false;
    if (family !== "all" && candidate.functionalFamily !== family) return false;
    if (normalizedQuery && ![candidate.nameEn, ...candidate.externalIds, candidate.suggestedLocal?.nameEn ?? ""].some((value) => value.toLowerCase().includes(normalizedQuery))) return false;
    return true;
  }), [classification, family, normalizedQuery, showResolved]);
  const pending = updateCandidates.candidates.filter((entry) => entry.reviewStatus === "pending");
  const functional = pending.filter((entry) => entry.classification === "functional_candidate").length;
  const approved = updateCandidates.candidates.filter((entry) => entry.reviewStatus === "approved").length;
  const rejected = updateCandidates.candidates.filter((entry) => entry.reviewStatus === "rejected").length;

  return <section className="field-review" aria-label="Revisión de datos pendientes">
    <header className="field-review-header">
      <div><p className="eyebrow">INVENTARIO EDITORIAL</p><h1>Objetos pendientes</h1><p>Entradas detectadas en Jötunn que todavía no forman parte confirmada del catálogo.</p></div>
      <div className="field-review-meta"><small>Valheim analizado</small><strong>{updateCandidates.source.gameVersion ?? updateCandidates.gameVersion}</strong><span>Generado {new Date(updateCandidates.generatedAt).toLocaleDateString("es")}</span></div>
    </header>
    <div className="field-review-notice"><strong>Vista de solo lectura</strong><span>“Candidato funcional” significa que merece contraste; no confirma que deba incorporarse.</span></div>
    <div className="field-review-stats">
      <div><small>Pendientes</small><strong>{pending.length}</strong></div>
      <div><small>Candidatos funcionales</small><strong>{functional}</strong></div>
      <div><small>Aprobados / rechazados</small><strong>{approved} / {rejected}</strong></div>
      <div><small>Total analizado</small><strong>{updateCandidates.candidates.length}</strong></div>
    </div>
    <section className="field-review-controls">
      <label className="field-search"><span aria-hidden="true">⌕</span><input aria-label="Buscar candidatos" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar nombre o identificador externo…" /></label>
      <div className="field-filter-row" role="group" aria-label="Clasificación editorial">
        {candidateClassifications.map((value) => <button key={value} className={classification === value ? "active" : ""} aria-pressed={classification === value} onClick={() => setClassification(value)}>{candidateClassificationLabels[value]}</button>)}
      </div>
      <div className="field-review-secondary">
        <label>Familia <select value={family} onChange={(event) => setFamily(event.target.value as typeof family)}><option value="all">Todas</option>{Object.entries(candidateFamilyLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="field-review-toggle"><input type="checkbox" checked={showResolved} onChange={(event) => setShowResolved(event.target.checked)} /> Mostrar aprobados, rechazados, conocidos y excluidos</label>
        <span>{visible.length} resultados</span>
      </div>
    </section>
    <div className="field-candidate-grid">
      {visible.map((candidate) => <CandidateCard key={candidate.id} candidate={candidate} />)}
      {!visible.length && <p className="field-empty">No hay entradas que coincidan con estos filtros.</p>}
    </div>
  </section>;
}

function CandidateCard({ candidate }: { candidate: UpdateCandidate }) {
  return <article className={`field-candidate ${candidate.classification}`}>
    <header><div><p>{candidateClassificationLabels[candidate.classification]}</p><h2>{candidate.nameEn}</h2></div><span className={`confidence ${candidate.confidence}`}>{candidate.confidence === "high" ? "Alta" : candidate.confidence === "medium" ? "Media" : "Baja"}</span></header>
    <p>{candidate.reason}</p>
    <div className="field-candidate-tags">
      {candidate.functionalFamily && <span>{candidateFamilyLabels[candidate.functionalFamily]}</span>}
      {candidate.sourceKinds.map((kind) => <span key={kind}>{kind === "recipe" ? "Receta" : "Pieza"}</span>)}
      <span>{reviewStatusLabel(candidate.reviewStatus)}</span>
    </div>
    {candidate.suggestedLocal && <p className="field-candidate-match">Posible coincidencia local: <strong>{candidate.suggestedLocal.nameEn}</strong> <small>{Math.round(candidate.suggestedLocal.similarity * 100)}%</small></p>}
    <details><summary>Identificadores externos ({candidate.externalIds.length})</summary><code>{candidate.externalIds.join(" · ")}</code></details>
  </article>;
}

function reviewStatusLabel(status: UpdateCandidate["reviewStatus"]) {
  return { pending: "Pendiente", approved: "Aprobado", rejected: "Rechazado", known: "Ya conocido", excluded: "Excluido" }[status];
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
  const extensionGroup = stationExtensions.find((group) => group.stationItemId === selected.id);

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
        <StationLevelRequirement stationId={recipe.stationId} stationLevel={recipe.craft.stationLevel} />
        {(recipe.outputAmount ?? 1) > 1 && <p className="field-output">Produce <strong>×{recipe.outputAmount}</strong></p>}
        {recipe.craft.materials.map((cost) => <Cost key={cost.materialId} materialId={cost.materialId} amount={cost.amount} />)}
      </section>
      {extensionGroup && <section className="field-block field-station-extensions" aria-label={`Extensiones de ${selected.name.es}`}>
        <div className="field-block-title"><h3>Mejoras de estación</h3><span>Nivel máximo {extensionGroup.maxLevel}</span></div>
        <p>Cada extensión distinta cercana aumenta un nivel. El orden muestra la progresión habitual.</p>
        {extensionGroup.extensions.map((extension, index) => {
          const extensionItem = byId(items, extension.itemId)!;
          const extensionRecipe = recipes.find((entry) => entry.itemId === extension.itemId)!;
          return <details key={extension.itemId} className="field-extension-detail">
            <summary><b>Nivel {index + 2}</b><span>{extensionItem.icon}</span><span><strong>{extensionItem.name.es}</strong><small>{extensionItem.name.en}</small></span></summary>
            <div className="field-extension-materials">
              <p>Construcción · {byId(stations, extensionRecipe.stationId)?.name.es}</p>
              {extensionRecipe.craft.materials.map((cost) => <Cost key={cost.materialId} materialId={cost.materialId} amount={cost.amount} />)}
            </div>
          </details>;
        })}
      </section>}
      {recipe.upgrades.length > 0 && <details className="field-block field-disclosure"><summary>Mejoras disponibles <span>{recipe.upgrades.length} niveles</span></summary>
        <section className="field-upgrade-total" aria-label={`Costo total desde nivel 1 hasta nivel ${upgradeCosts.at(-1)?.targetLevel}`}>
          <div><p>Costo total acumulado</p><strong>Nivel 1 → Nivel {upgradeCosts.at(-1)?.targetLevel}</strong></div>
          {upgradeCosts.at(-1)?.cumulative.map((cost) => <Cost key={`maximum-${cost.materialId}`} materialId={cost.materialId} amount={cost.amount} />)}
        </section>
        {upgradeCosts.map((upgrade) => <section className="field-upgrade" key={upgrade.targetLevel}>
          <h4>Mejora a nivel {upgrade.targetLevel}</h4>
          <StationLevelRequirement stationId={recipe.stationId} stationLevel={recipe.upgrades.find((entry) => entry.targetLevel === upgrade.targetLevel)?.stationLevel ?? 1} />
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

function StationLevelRequirement({ stationId, stationLevel }: { stationId: string; stationLevel: number }) {
  const requirement = stationRequirement(stationId, stationLevel);
  if (!requirement) return null;
  return <details className="field-station-requirement">
    <summary>Requiere {byId(stations, stationId)?.name.es} nivel {stationLevel}</summary>
    <p>Construí {requirement.extensionCount} {requirement.extensionCount === 1 ? "extensión distinta" : "extensiones distintas"} cerca de la estación.</p>
    <ul>{requirement.group.extensions.map((extension) => <li key={extension.itemId}>{byId(items, extension.itemId)?.name.es}</li>)}</ul>
  </details>;
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
