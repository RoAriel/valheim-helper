"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type Ref } from "react";
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
import { updateCandidates } from "@/data/update-candidates";
import { ReviewWorkspace } from "./components/review-workspace";
import { UpdateDialog } from "./components/update-dialog";

const categories: CatalogCategory[] = ["Todos", "Armas", "Herramientas", "Construcción", "Comida", "Defensa"];
type NavigationState = {
  biomeId: string;
  query: string;
  category: CatalogCategory;
  subcategoryId: string;
  foodFocus: FoodFocus;
  infrastructureFocus: InfrastructureFocus;
  selectedId: string;
};

function navigationFromUrl(): Partial<NavigationState> {
  const parameters = new URLSearchParams(window.location.search);
  const biomeId = parameters.get("biome");
  const category = parameters.get("category");
  const subcategoryId = parameters.get("subcategory");
  const foodFocus = parameters.get("benefit");
  const infrastructureFocus = parameters.get("function");
  const selectedId = parameters.get("item");
  return {
    biomeId: biomeId === "all" || biomes.some((entry) => entry.id === biomeId) ? biomeId : undefined,
    query: parameters.get("q") ?? undefined,
    category: categories.includes(category as CatalogCategory) ? category as CatalogCategory : undefined,
    subcategoryId: subcategoryId === "all" || subcategories.some((entry) => entry.id === subcategoryId) ? subcategoryId : undefined,
    foodFocus: ["all", "health", "stamina", "eitr", "healing", "resistance", "mobility"].includes(foodFocus ?? "") ? foodFocus as FoodFocus : undefined,
    infrastructureFocus: ["all", "stations_processing"].includes(infrastructureFocus ?? "") ? infrastructureFocus as InfrastructureFocus : undefined,
    selectedId: items.some((entry) => entry.id === selectedId) ? selectedId : undefined,
  };
}

function urlForNavigation(state: NavigationState) {
  const parameters = new URLSearchParams();
  if (state.biomeId !== "all") parameters.set("biome", state.biomeId);
  if (state.query) parameters.set("q", state.query);
  if (state.category !== "Todos") parameters.set("category", state.category);
  if (state.subcategoryId !== "all") parameters.set("subcategory", state.subcategoryId);
  if (state.foodFocus !== "all") parameters.set("benefit", state.foodFocus);
  if (state.infrastructureFocus !== "all") parameters.set("function", state.infrastructureFocus);
  if (state.selectedId !== items[0].id) parameters.set("item", state.selectedId);
  const query = parameters.toString();
  return `${window.location.pathname}${query ? `?${query}` : ""}`;
}

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
  const catalogRef = useRef<HTMLElement>(null);
  const updateButtonRef = useRef<HTMLButtonElement>(null);
  const navigationReady = useRef(false);

  const filteredItems = useMemo(
    () => filterCatalogItems({ biomeId, query, category, subcategoryId, foodFocus, infrastructureFocus }),
    [biomeId, category, foodFocus, infrastructureFocus, query, subcategoryId],
  );
  const availableSubcategories = category === "Todos" ? [] : subcategories.filter((subcategory) => subcategory.category === category);
  const selected = resolveSelectedItem(filteredItems, selectedId);

  const navigationState = { biomeId, query, category, subcategoryId, foodFocus, infrastructureFocus, selectedId };

  function restoreNavigation(state: Partial<NavigationState>) {
    setBiomeId(state.biomeId ?? "all");
    setQuery(state.query ?? "");
    setCategory(state.category ?? "Todos");
    setSubcategoryId(state.subcategoryId ?? "all");
    setFoodFocus(state.foodFocus ?? "all");
    setInfrastructureFocus(state.infrastructureFocus ?? "all");
    setSelectedId(state.selectedId ?? items[0].id);
  }

  function updateNavigation(mode: "push" | "replace", overrides: Partial<NavigationState>) {
    if (!navigationReady.current) return;
    window.history[mode === "push" ? "pushState" : "replaceState"]({}, "", urlForNavigation({ ...navigationState, ...overrides }));
  }

  useEffect(() => {
    navigationReady.current = true;
    const initialRestore = window.setTimeout(() => restoreNavigation(navigationFromUrl()), 0);
    const restoreFromHistory = () => restoreNavigation(navigationFromUrl());
    window.addEventListener("popstate", restoreFromHistory);
    return () => {
      window.clearTimeout(initialRestore);
      window.removeEventListener("popstate", restoreFromHistory);
    };
  }, []);

  useEffect(() => {
    if (!navigationReady.current || !selected || selected.id === selectedId) return;
    const nextSelectedId = selected.id;
    window.history.replaceState({}, "", urlForNavigation({ biomeId, query, category, subcategoryId, foodFocus, infrastructureFocus, selectedId: nextSelectedId }));
    queueMicrotask(() => setSelectedId(nextSelectedId));
  }, [biomeId, category, foodFocus, infrastructureFocus, query, selected, selectedId, subcategoryId]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (event.target instanceof HTMLSelectElement) return;
      if (query) {
        event.preventDefault();
        window.history.replaceState({}, "", urlForNavigation({ biomeId, query: "", category, subcategoryId, foodFocus, infrastructureFocus, selectedId }));
        setQuery("");
        return;
      }
      if (biomeId === "all" && category === "Todos" && subcategoryId === "all" && foodFocus === "all" && infrastructureFocus === "all") return;
      event.preventDefault();
      window.history.pushState({}, "", urlForNavigation({ biomeId: "all", query: "", category: "Todos", subcategoryId: "all", foodFocus: "all", infrastructureFocus: "all", selectedId }));
      setBiomeId("all");
      setCategory("Todos");
      setSubcategoryId("all");
      setFoodFocus("all");
      setInfrastructureFocus("all");
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [biomeId, category, foodFocus, infrastructureFocus, query, selectedId, subcategoryId]);

  const closeUpdates = useCallback(() => setUpdateOpen(false), []);

  function selectView(nextView: "catalog" | "review") {
    setActiveView(nextView);
    requestAnimationFrame(() => document.getElementById(`${nextView}-tab`)?.focus());
  }

  function navigateTabs(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (!(["ArrowLeft", "ArrowRight", "Home", "End"] as string[]).includes(event.key)) return;
    event.preventDefault();
    if (event.key === "Home") return selectView("catalog");
    if (event.key === "End") return selectView("review");
    selectView(activeView === "catalog" ? "review" : "catalog");
  }

  function clearFilters() {
    updateNavigation("push", { biomeId: "all", query: "", category: "Todos", subcategoryId: "all", foodFocus: "all", infrastructureFocus: "all" });
    setBiomeId("all");
    setQuery("");
    setCategory("Todos");
    setSubcategoryId("all");
    setFoodFocus("all");
    setInfrastructureFocus("all");
  }

  function selectCategory(nextCategory: CatalogCategory) {
    updateNavigation("push", { category: nextCategory, subcategoryId: "all", foodFocus: nextCategory === "Comida" ? foodFocus : "all", infrastructureFocus: nextCategory === "Construcción" ? infrastructureFocus : "all" });
    setCategory(nextCategory);
    setSubcategoryId("all");
    if (nextCategory !== "Comida") setFoodFocus("all");
    if (nextCategory !== "Construcción") setInfrastructureFocus("all");
  }

  function selectItem(itemId: string) {
    updateNavigation("push", { selectedId: itemId });
    setSelectedId(itemId);
    if (window.matchMedia("(max-width: 780px)").matches) {
      requestAnimationFrame(() => detailRef.current?.scrollIntoView({ block: "start" }));
    }
  }

  function selectRelatedItem(itemId: string) {
    const target = byId(items, itemId)!;
    const next: NavigationState = { ...navigationState, query: "", selectedId: itemId };
    if (next.biomeId !== "all" && next.biomeId !== target.stageBiomeId) next.biomeId = "all";
    if (next.category !== "Todos" && next.category !== target.category) next.category = "Todos";
    if (next.subcategoryId !== "all" && !byId(subcategories, next.subcategoryId)?.itemIds.includes(itemId)) next.subcategoryId = "all";
    if (next.foodFocus !== "all" && !filterCatalogItems({ ...next, biomeId: "all", category: "Todos", subcategoryId: "all", infrastructureFocus: "all" }).some((entry) => entry.id === itemId)) next.foodFocus = "all";
    if (next.infrastructureFocus !== "all" && !filterCatalogItems({ ...next, biomeId: "all", category: "Todos", subcategoryId: "all", foodFocus: "all" }).some((entry) => entry.id === itemId)) next.infrastructureFocus = "all";
    window.history.pushState({}, "", urlForNavigation(next));
    setBiomeId(next.biomeId);
    setQuery(next.query);
    setCategory(next.category);
    setSubcategoryId(next.subcategoryId);
    setFoodFocus(next.foodFocus);
    setInfrastructureFocus(next.infrastructureFocus);
    setSelectedId(itemId);
    if (window.matchMedia("(max-width: 780px)").matches) requestAnimationFrame(() => detailRef.current?.scrollIntoView({ block: "start" }));
  }

  function selectBiome(nextBiomeId: string) {
    updateNavigation("push", { biomeId: nextBiomeId });
    setBiomeId(nextBiomeId);
  }

  function changeQuery(nextQuery: string) {
    updateNavigation("replace", { query: nextQuery });
    setQuery(nextQuery);
  }

  function selectSubcategory(nextSubcategoryId: string) {
    updateNavigation("push", { subcategoryId: nextSubcategoryId });
    setSubcategoryId(nextSubcategoryId);
  }

  function selectFoodFocus(nextFoodFocus: FoodFocus) {
    updateNavigation("push", { foodFocus: nextFoodFocus });
    setFoodFocus(nextFoodFocus);
  }

  function selectInfrastructureFocus(nextFocus: InfrastructureFocus) {
    updateNavigation("push", { infrastructureFocus: nextFocus });
    setInfrastructureFocus(nextFocus);
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
      <p className="sr-only" aria-live="polite">{selected ? `Objeto seleccionado: ${selected.name.es}` : "No hay objetos en los resultados"}</p>
      <header className="field-topbar">
        <span className="field-brand">VALHEIM <b>HELPER</b></span>
        <div className="field-view-tabs" role="tablist" aria-label="Secciones de la aplicación" tabIndex={-1} onKeyDown={navigateTabs}>
          <button id="catalog-tab" role="tab" aria-controls="catalog-panel" aria-selected={activeView === "catalog"} tabIndex={activeView === "catalog" ? 0 : -1} className={activeView === "catalog" ? "active" : ""} onClick={() => selectView("catalog")}>Catálogo</button>
          <button id="review-tab" role="tab" aria-controls="review-panel" aria-selected={activeView === "review"} tabIndex={activeView === "review" ? 0 : -1} className={activeView === "review" ? "active" : ""} onClick={() => selectView("review")}>
            Revisión de datos <span>{updateCandidates.candidates.filter((entry) => entry.reviewStatus === "pending").length}</span>
          </button>
        </div>
        <div className="field-update-control">
          <small>Valheim {manifest.gameVersion}</small>
          <button ref={updateButtonRef} onClick={checkUpdates} disabled={updateLoading}>{updateLoading ? "Comprobando…" : "Buscar actualizaciones"}</button>
        </div>
      </header>

      {updateOpen && <UpdateDialog diagnosis={updateDiagnosis} loading={updateLoading} error={updateError} onRetry={checkUpdates} onClose={closeUpdates} returnFocusRef={updateButtonRef} />}

      {activeView === "review" ? <div id="review-panel" role="tabpanel" aria-labelledby="review-tab"><ReviewWorkspace /></div> : <section id="catalog-panel" role="tabpanel" aria-labelledby="catalog-tab" className="field-layout">
        <nav className="field-progression" aria-label="Progresión por bioma">
          <div className="field-progression-intro">
            <p className="eyebrow">PROGRESIÓN</p>
            <h1>Tu ruta vikinga</h1>
            <p>Elegí una etapa para acotar el catálogo.</p>
          </div>
          <button className={biomeId === "all" ? "active" : ""} aria-pressed={biomeId === "all"} onClick={() => selectBiome("all")}>
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
                <button key={biome.id} style={style} className={biomeId === biome.id ? "active" : ""} aria-pressed={biomeId === biome.id} onClick={() => selectBiome(biome.id)}>
                  <i>{biome.theme.symbol}</i>
                  <span>{biome.name.es}<small>{biome.name.en} · {stationNames.join(" / ")}</small></span>
                  <b>{count}</b>
                </button>
              );
            })}
          </div>
        </nav>

        <section ref={catalogRef} className="field-catalog" aria-label="Catálogo en modo planificación">
          <header>
            <p className="eyebrow">MODO PLANIFICAR</p>
            <h2>¿Qué querés preparar?</h2>
            <label className="field-search">
              <span aria-hidden="true">⌕</span>
              <input aria-label="Buscar por objeto o nombre en inglés" value={query} onChange={(event) => changeQuery(event.target.value)} placeholder="Buscar por objeto o nombre en inglés…" />
              {query && <button type="button" className="field-search-clear" aria-label="Borrar búsqueda" onClick={() => changeQuery("")}>×</button>}
            </label>
            <div className="field-filter-row" role="group" aria-label="Filtrar por categoría">
              {categories.map((value) => (
                <button key={value} className={category === value ? "active" : ""} aria-pressed={category === value} onClick={() => selectCategory(value)}>{value}</button>
              ))}
            </div>
            {availableSubcategories.length > 0 && (
              <div className="field-subfilter-row" role="group" aria-label={`Filtrar ${category}`}>
                <span>{category}</span>
                <button className={subcategoryId === "all" ? "active" : ""} aria-pressed={subcategoryId === "all"} onClick={() => selectSubcategory("all")}>Todas</button>
                {availableSubcategories.map((subcategory) => (
                  <button key={subcategory.id} className={subcategoryId === subcategory.id ? "active" : ""} aria-pressed={subcategoryId === subcategory.id} onClick={() => selectSubcategory(subcategory.id)}>{subcategory.name.es}</button>
                ))}
              </div>
            )}
            {category === "Comida" && (
              <label className="field-food-filter">
                <span>BENEFICIO</span>
                <select value={foodFocus} onChange={(event) => selectFoodFocus(event.target.value as FoodFocus)}>
                  <option value="all">Todos los beneficios</option><option value="health">Prioriza salud</option><option value="healing">Curación</option><option value="resistance">Resistencia</option><option value="stamina">Prioriza aguante</option><option value="eitr">Aporta eitr</option><option value="mobility">Movilidad</option>
                </select>
              </label>
            )}
            {category === "Construcción" && (
              <div className="field-subfilter-row" role="group" aria-label="Filtrar construcciones funcionales">
                <span>FUNCIÓN</span>
                <button className={infrastructureFocus === "all" ? "active" : ""} aria-pressed={infrastructureFocus === "all"} onClick={() => selectInfrastructureFocus("all")}>Todas</button>
                <button className={infrastructureFocus === "stations_processing" ? "active" : ""} aria-pressed={infrastructureFocus === "stations_processing"} onClick={() => selectInfrastructureFocus("stations_processing")}>Estaciones y proceso</button>
              </div>
            )}
            <div className="field-summary">
              <span aria-live="polite">{filteredItems.length} objetos</span>
              <span className="field-summary-description">Lista compacta · estación · bioma</span>
              <button className="field-clear" onClick={clearFilters}>Limpiar filtros</button>
              <span className="field-clear-shortcut" aria-hidden="true">Esc</span>
            </div>
            <div className="field-active-filters" aria-label="Filtros activos">
              {biomeId !== "all" && <button onClick={() => selectBiome("all")}>{byId(biomes, biomeId)?.name.es}<span>×</span></button>}
              {category !== "Todos" && <button onClick={() => selectCategory("Todos")}>{category}<span>×</span></button>}
              {subcategoryId !== "all" && <button onClick={() => selectSubcategory("all")}>{byId(subcategories, subcategoryId)?.name.es}<span>×</span></button>}
              {foodFocus !== "all" && <button onClick={() => selectFoodFocus("all")}>Beneficio: {foodFocusLabel(foodFocus)}<span>×</span></button>}
              {infrastructureFocus !== "all" && <button onClick={() => selectInfrastructureFocus("all")}>Estaciones y proceso<span>×</span></button>}
            </div>
          </header>
          <div className="field-item-list">
            {filteredItems.map((item) => {
              const { biome, style } = themeForBiome(item.stageBiomeId);
              const itemRecipe = recipes.find((entry) => entry.itemId === item.id)!;
              return (
                <button key={item.id} style={style} className={selected?.id === item.id ? "selected" : ""} aria-pressed={selected?.id === item.id} onClick={() => selectItem(item.id)}>
                  <span className="field-item-icon">{item.icon}</span>
                  <span className="field-item-name"><strong>{item.name.es}</strong><small>{item.name.en}</small>{item.category === "Comida" && <span className="field-item-food-stats">{foodSummary(item.id)}</span>}</span>
                  <span className="field-row-meta"><small>ESTACIÓN</small>{byId(stations, itemRecipe.stationId)?.name.es}</span>
                  <span className="field-row-biome">{biome.theme.symbol} {biome.name.es}</span><b>›</b>
                </button>
              );
            })}
            {!filteredItems.length && <p className="field-empty">No hay objetos que coincidan con estos filtros.</p>}
          </div>
        </section>

        {selected ? <ItemDetail itemId={selected.id} detailRef={detailRef} onBackToResults={() => catalogRef.current?.scrollIntoView({ block: "start" })} onSelectItem={selectRelatedItem} /> : <aside ref={detailRef} className="field-detail field-detail-empty" aria-label="Sin objeto seleccionado"><p className="eyebrow">SIN RESULTADOS</p><h2>Ajustá la búsqueda</h2><p>Probá con otro término o limpiá los filtros para volver al catálogo completo.</p><button onClick={clearFilters}>Limpiar filtros</button></aside>}
      </section>}
    </main>
  );
}

function ItemDetail({ itemId, detailRef, onBackToResults, onSelectItem }: { itemId: string; detailRef: Ref<HTMLElement>; onBackToResults: () => void; onSelectItem: (itemId: string) => void }) {
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
      <button className="field-back-results" onClick={onBackToResults}>← Volver a resultados</button>
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
        {recipe.craft.materials.map((cost) => <Ingredient key={ingredientKey(cost)} cost={cost} onSelectItem={onSelectItem} />)}
      </section>
      <details className="field-block field-plan field-disclosure" open><summary>Plan de objetivo <span>Materias primas</span></summary>
        <div className="field-tags">{goalPlan.stationIds.map((stationId) => <span key={stationId}>⚒ {byId(stations, stationId)?.name.es}</span>)}</div>
        <div className="field-tags">{collectionBiomes.map((biome) => <span key={biome.id}>⌖ {biome.name.es}</span>)}</div>
        {goalPlan.materials.map((cost) => <Cost key={cost.materialId} materialId={cost.materialId} amount={cost.amount} />)}
      </details>
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
              {extensionRecipe.craft.materials.map((cost) => <Ingredient key={ingredientKey(cost)} cost={cost} onSelectItem={onSelectItem} />)}
              <button className="field-related-link" onClick={() => onSelectItem(extension.itemId)}>Ver ficha de {extensionItem.name.es} →</button>
            </div>
          </details>;
        })}
      </section>}
      {recipe.upgrades.length > 0 && <details className="field-block field-disclosure"><summary>Mejoras disponibles <span>{recipe.upgrades.length} niveles</span></summary>
        <section className="field-upgrade-total" aria-label={`Costo total desde nivel 1 hasta nivel ${upgradeCosts.at(-1)?.targetLevel}`}>
          <div><p>Costo total acumulado</p><strong>Nivel 1 → Nivel {upgradeCosts.at(-1)?.targetLevel}</strong></div>
          {upgradeCosts.at(-1)?.cumulative.map((cost) => <Ingredient key={`maximum-${ingredientKey(cost)}`} cost={cost} onSelectItem={onSelectItem} />)}
        </section>
        {upgradeCosts.map((upgrade) => <section className="field-upgrade" key={upgrade.targetLevel}>
          <h4>Mejora a nivel {upgrade.targetLevel}</h4>
          <StationLevelRequirement stationId={recipe.stationId} stationLevel={recipe.upgrades.find((entry) => entry.targetLevel === upgrade.targetLevel)?.stationLevel ?? 1} />
          <p>Costo de este nivel</p>
          {upgrade.step.map((cost) => <Ingredient key={`step-${ingredientKey(cost)}`} cost={cost} onSelectItem={onSelectItem} />)}
        </section>)}
      </details>}
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

type IngredientCost = { materialId: string; amount: number } | { itemId: string; amount: number };

function ingredientKey(cost: IngredientCost) {
  return "materialId" in cost ? `material-${cost.materialId}` : `item-${cost.itemId}`;
}

function Ingredient({ cost, onSelectItem }: { cost: IngredientCost; onSelectItem: (itemId: string) => void }) {
  if ("materialId" in cost) return <Cost materialId={cost.materialId} amount={cost.amount} />;
  const item = byId(items, cost.itemId)!;
  const recipe = recipes.find((entry) => entry.itemId === cost.itemId)!;
  return <details className="field-cost-detail">
    <summary className="field-cost"><span>{item.icon}</span><span><strong>{item.name.es}</strong><small>{item.name.en} · objeto base</small></span><b>×{cost.amount}</b></summary>
    <div className="field-source-list"><div><strong>Fabricación previa</strong><small>{byId(stations, recipe.stationId)?.name.es}</small><span>Se expande automáticamente en el Plan de objetivo.</span><button className="field-related-link" onClick={() => onSelectItem(item.id)}>Ver ficha de {item.name.es} →</button></div></div>
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

function foodFocusLabel(focus: FoodFocus) {
  return { all: "Todos", health: "Salud", healing: "Curación", resistance: "Resistencia", stamina: "Aguante", eitr: "Eitr", mobility: "Movilidad" }[focus];
}

function foodSummary(itemId: string) {
  const effect = foodEffects.find((entry) => entry.itemId === itemId);
  if (!effect) return "Propiedades no registradas";
  return [
    effect.health ? `Salud ${effect.health}` : "",
    effect.stamina ? `Aguante ${effect.stamina}` : "",
    effect.eitr ? `Eitr ${effect.eitr}` : "",
    formatDuration(effect.durationSeconds),
  ].filter(Boolean).join(" · ");
}
