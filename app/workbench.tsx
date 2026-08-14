"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import {
  biomes,
  byId,
  items,
  subcategories,
} from "@/data/catalog";
import { filterCatalogItems, resolveSelectedItem, type CatalogCategory, type FoodFocus, type InfrastructureFocus } from "@/data/catalog-filters";
import type { UpdateDiagnosis } from "@/data/update-check";
import { updateCandidates } from "@/data/update-candidates";
import { ReviewWorkspace } from "./components/review-workspace";
import { UpdateDialog } from "./components/update-dialog";
import { MaintenanceWorkspace } from "./components/maintenance-workspace";
import { ItemDetail } from "./components/item-detail";
import { AppHeader, BiomeNavigation, ItemList } from "./components/catalog-navigation";
import { CatalogFilters, catalogCategories } from "./components/catalog-filters";

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
    category: catalogCategories.includes(category as CatalogCategory) ? category as CatalogCategory : undefined,
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

export default function Workbench() {
  const [activeView, setActiveView] = useState<"catalog" | "maintenance" | "review">("catalog");
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

  function selectSection(nextSection: "catalog" | "maintenance") {
    setActiveView(nextSection);
    requestAnimationFrame(() => document.getElementById(`${nextSection}-tab`)?.focus());
  }

  function navigateTabs(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (!(["ArrowLeft", "ArrowRight", "Home", "End"] as string[]).includes(event.key)) return;
    event.preventDefault();
    if (event.key === "Home") return selectSection("catalog");
    if (event.key === "End") return selectSection("maintenance");
    selectSection(activeView === "catalog" ? "maintenance" : "catalog");
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
      <AppHeader activeView={activeView} pending={updateCandidates.candidates.filter((entry) => entry.reviewStatus === "pending").length} onSelect={selectSection} onKeyDown={navigateTabs} />

      {updateOpen && <UpdateDialog diagnosis={updateDiagnosis} loading={updateLoading} error={updateError} onRetry={checkUpdates} onClose={closeUpdates} returnFocusRef={updateButtonRef} />}

      {activeView !== "catalog" ? <div id="maintenance-panel" role="tabpanel" aria-labelledby="maintenance-tab">
        {activeView === "review"
          ? <ReviewWorkspace onBack={() => setActiveView("maintenance")} />
          : <MaintenanceWorkspace loading={updateLoading} onCheckUpdates={checkUpdates} onOpenReview={() => setActiveView("review")} updateButtonRef={updateButtonRef} />}
      </div> : <section id="catalog-panel" role="tabpanel" aria-labelledby="catalog-tab" className="field-layout">
        <BiomeNavigation selectedId={biomeId} onSelect={selectBiome} />

        <section ref={catalogRef} className="field-catalog" aria-label="Catálogo en modo planificación">
          <CatalogFilters biomeId={biomeId} query={query} category={category} subcategoryId={subcategoryId} foodFocus={foodFocus} infrastructureFocus={infrastructureFocus} resultCount={filteredItems.length} onQueryChange={changeQuery} onCategoryChange={selectCategory} onSubcategoryChange={selectSubcategory} onFoodFocusChange={selectFoodFocus} onInfrastructureFocusChange={selectInfrastructureFocus} onBiomeClear={() => selectBiome("all")} onClear={clearFilters} />
          <ItemList entries={filteredItems} selectedId={selected?.id} onSelect={selectItem} />
        </section>

        {selected ? <ItemDetail itemId={selected.id} detailRef={detailRef} onBackToResults={() => catalogRef.current?.scrollIntoView({ block: "start" })} onSelectItem={selectRelatedItem} /> : <aside ref={detailRef} className="field-detail field-detail-empty" aria-label="Sin objeto seleccionado"><p className="eyebrow">SIN RESULTADOS</p><h2>Ajustá la búsqueda</h2><p>Probá con otro término o limpiá los filtros para volver al catálogo completo.</p><button onClick={clearFilters}>Limpiar filtros</button></aside>}
      </section>}
    </main>
  );
}
