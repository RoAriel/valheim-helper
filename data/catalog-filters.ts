import { foodEffects, items, subcategories, type Item } from "./catalog.ts";
import progressionInfrastructure from "./progression-infrastructure.json" with { type: "json" };

export type CatalogCategory = "Todos" | Item["category"];
export type FoodFocus = "all" | "health" | "stamina" | "eitr" | "healing" | "resistance" | "mobility";
export type InfrastructureFocus = "all" | "stations_processing";

export type CatalogFilters = {
  biomeId: string;
  query: string;
  category: CatalogCategory;
  subcategoryId: string;
  foodFocus: FoodFocus;
  infrastructureFocus?: InfrastructureFocus;
};

export function matchesFoodFocus(itemId: string, focus: FoodFocus) {
  const effect = foodEffects.find((entry) => entry.itemId === itemId);
  if (focus === "all") return true;
  if (focus === "health") return (effect?.health ?? 0) > (effect?.stamina ?? 0) && (effect?.health ?? 0) > (effect?.eitr ?? 0);
  if (focus === "stamina") return (effect?.stamina ?? 0) > (effect?.health ?? 0) && (effect?.stamina ?? 0) > (effect?.eitr ?? 0);
  if (focus === "eitr") return (effect?.eitr ?? 0) > 0;
  if (focus === "healing") return effect?.effects?.some((entry) => entry.includes("Curación")) ?? false;
  if (focus === "resistance") return effect?.effects?.some((entry) => entry.includes("Resistencia")) ?? false;
  return effect?.effects?.some((entry) => /velocidad|salto|nadar/i.test(entry)) ?? false;
}

export function filterCatalogItems(filters: CatalogFilters) {
  const normalizedQuery = filters.query.trim().toLocaleLowerCase("es");
  const subcategory = subcategories.find((entry) => entry.id === filters.subcategoryId);

  return items.filter((item) => (
    (filters.biomeId === "all" || item.stageBiomeId === filters.biomeId)
    && (filters.category === "Todos" || item.category === filters.category)
    && (filters.subcategoryId === "all" || subcategory?.itemIds.includes(item.id))
    && (filters.infrastructureFocus !== "stations_processing" || progressionInfrastructure.itemIds.includes(item.id))
    && matchesFoodFocus(item.id, filters.foodFocus)
    && `${item.name.es} ${item.name.en} ${item.category}`.toLocaleLowerCase("es").includes(normalizedQuery)
  ));
}

export function resolveSelectedItem(filteredItems: Item[], selectedId: string) {
  return filteredItems.find((item) => item.id === selectedId) ?? filteredItems[0] ?? null;
}
