"use client";

import { biomes, byId, subcategories } from "@/data/catalog";
import type { CatalogCategory, FoodFocus, InfrastructureFocus } from "@/data/catalog-filters";

export const catalogCategories: CatalogCategory[] = ["Todos", "Armas", "Herramientas", "Construcción", "Comida", "Defensa"];

type Props = {
  biomeId: string;
  query: string;
  category: CatalogCategory;
  subcategoryId: string;
  foodFocus: FoodFocus;
  infrastructureFocus: InfrastructureFocus;
  resultCount: number;
  onQueryChange: (query: string) => void;
  onCategoryChange: (category: CatalogCategory) => void;
  onSubcategoryChange: (subcategoryId: string) => void;
  onFoodFocusChange: (focus: FoodFocus) => void;
  onInfrastructureFocusChange: (focus: InfrastructureFocus) => void;
  onBiomeClear: () => void;
  onClear: () => void;
};

export function CatalogFilters({ biomeId, query, category, subcategoryId, foodFocus, infrastructureFocus, resultCount, onQueryChange, onCategoryChange, onSubcategoryChange, onFoodFocusChange, onInfrastructureFocusChange, onBiomeClear, onClear }: Props) {
  const availableSubcategories = category === "Todos" ? [] : subcategories.filter((subcategory) => subcategory.category === category);

  return <header>
    <p className="eyebrow">MODO PLANIFICAR</p>
    <h2>¿Qué querés preparar?</h2>
    <label className="field-search">
      <span aria-hidden="true">⌕</span>
      <input aria-label="Buscar por objeto o nombre en inglés" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Buscar por objeto o nombre en inglés…" />
      {query && <button type="button" className="field-search-clear" aria-label="Borrar búsqueda" onClick={() => onQueryChange("")}>×</button>}
    </label>
    <div className="field-filter-row" role="group" aria-label="Filtrar por categoría">
      {catalogCategories.map((value) => <button key={value} className={category === value ? "active" : ""} aria-pressed={category === value} onClick={() => onCategoryChange(value)}>{value}</button>)}
    </div>
    {availableSubcategories.length > 0 && <div className="field-subfilter-row" role="group" aria-label={`Filtrar ${category}`}>
      <span>{category}</span>
      <button className={subcategoryId === "all" ? "active" : ""} aria-pressed={subcategoryId === "all"} onClick={() => onSubcategoryChange("all")}>Todas</button>
      {availableSubcategories.map((subcategory) => <button key={subcategory.id} className={subcategoryId === subcategory.id ? "active" : ""} aria-pressed={subcategoryId === subcategory.id} onClick={() => onSubcategoryChange(subcategory.id)}>{subcategory.name.es}</button>)}
    </div>}
    {category === "Comida" && <label className="field-food-filter"><span>BENEFICIO</span><select value={foodFocus} onChange={(event) => onFoodFocusChange(event.target.value as FoodFocus)}>
      <option value="all">Todos los beneficios</option><option value="health">Prioriza salud</option><option value="healing">Curación</option><option value="resistance">Resistencia</option><option value="stamina">Prioriza aguante</option><option value="eitr">Aporta eitr</option><option value="mobility">Movilidad</option>
    </select></label>}
    {category === "Construcción" && <div className="field-subfilter-row" role="group" aria-label="Filtrar construcciones funcionales">
      <span>FUNCIÓN</span>
      <button className={infrastructureFocus === "all" ? "active" : ""} aria-pressed={infrastructureFocus === "all"} onClick={() => onInfrastructureFocusChange("all")}>Todas</button>
      <button className={infrastructureFocus === "stations_processing" ? "active" : ""} aria-pressed={infrastructureFocus === "stations_processing"} onClick={() => onInfrastructureFocusChange("stations_processing")}>Estaciones y proceso</button>
    </div>}
    <div className="field-summary">
      <span aria-live="polite">{resultCount} objetos</span><span className="field-summary-description">Lista compacta · estación · bioma</span><button className="field-clear" onClick={onClear}>Limpiar filtros</button><span className="field-clear-shortcut" aria-hidden="true">Esc</span>
    </div>
    <div className="field-active-filters" aria-label="Filtros activos">
      {biomeId !== "all" && <button onClick={onBiomeClear}>{byId(biomes, biomeId)?.name.es}<span>×</span></button>}
      {category !== "Todos" && <button onClick={() => onCategoryChange("Todos")}>{category}<span>×</span></button>}
      {subcategoryId !== "all" && <button onClick={() => onSubcategoryChange("all")}>{byId(subcategories, subcategoryId)?.name.es}<span>×</span></button>}
      {foodFocus !== "all" && <button onClick={() => onFoodFocusChange("all")}>Beneficio: {foodFocusLabel(foodFocus)}<span>×</span></button>}
      {infrastructureFocus !== "all" && <button onClick={() => onInfrastructureFocusChange("all")}>Estaciones y proceso<span>×</span></button>}
    </div>
  </header>;
}

function foodFocusLabel(focus: FoodFocus) {
  return { all: "Todos", health: "Salud", healing: "Curación", resistance: "Resistencia", stamina: "Aguante", eitr: "Eitr", mobility: "Movilidad" }[focus];
}
