"use client";

import { useMemo, useRef, useState, type CSSProperties, type Ref } from "react";
import {
  biomes,
  buildGoalPlan,
  byId,
  items,
  manifest,
  materials,
  recipes,
  sources,
  stations,
  subcategories,
} from "@/data/catalog";
import { filterCatalogItems, resolveSelectedItem, type CatalogCategory, type FoodFocus } from "@/data/catalog-filters";

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

  return (
    <main className="field-sample">
      <header className="field-topbar">
        <span className="field-brand">VALHEIM <b>HELPER</b></span>
        <div>
          <span>MESA DE TRABAJO</span>
          <strong>Recetas, progreso y planificación</strong>
        </div>
        <small>Valheim {manifest.gameVersion}</small>
      </header>

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

function ItemDetail({ itemId, detailRef }: { itemId: string; detailRef: Ref<HTMLElement> }) {
  const selected = byId(items, itemId)!;
  const { biome: selectedBiome, style: theme } = themeForBiome(selected.stageBiomeId);
  const recipe = recipes.find((entry) => entry.itemId === selected.id)!;
  const goalPlan = buildGoalPlan(selected.id);
  const collectionBiomes = namesForMaterials(goalPlan.materials.map((cost) => cost.materialId));

  return (
    <aside ref={detailRef} className="field-detail" style={theme} aria-label={`Detalle de ${selected.name.es}`}>
      <header>
        <span className="field-detail-icon">{selected.icon}</span>
        <div><p className="eyebrow">{selected.category} · {selectedBiome.theme.symbol} {selectedBiome.name.es}</p><h2>{selected.name.es}</h2><small>{selected.name.en}</small><p>{selected.description}</p></div>
      </header>
      <section className="field-block"><div className="field-block-title"><h3>Fabricación</h3><span>{byId(stations, recipe.stationId)?.name.es}</span></div>
        {recipe.craft.materials.map((cost) => <Cost key={cost.materialId} materialId={cost.materialId} amount={cost.amount} />)}
      </section>
      {recipe.upgrades.length > 0 && <details className="field-block field-disclosure"><summary>Mejoras disponibles <span>{recipe.upgrades.length} niveles</span></summary>
        {recipe.upgrades.map((upgrade) => <div className="field-upgrade" key={upgrade.targetLevel}><b>Nivel {upgrade.targetLevel}</b><span>{upgrade.materials.map((cost) => `${cost.amount} ${byId(materials, cost.materialId)?.name.es}`).join(" · ")}</span></div>)}
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
  return <div className="field-cost"><span>{material.icon}</span><strong>{material.name.es}</strong><b>×{amount}</b></div>;
}
