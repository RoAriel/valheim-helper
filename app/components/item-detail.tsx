"use client";

import { useState, type CSSProperties, type Ref } from "react";
import {
  biomes, buildGoalPlan, buildUpgradeCostSummaries, byId, foodEffects, items,
  materialRecipes, materials, recipes, sources, stationExtensions,
  stationRequirement, stations,
} from "@/data/catalog";

export function ItemDetail({ itemId, detailRef, onBackToResults, onSelectItem }: { itemId: string; detailRef: Ref<HTMLElement>; onBackToResults: () => void; onSelectItem: (itemId: string) => void }) {
  const selected = byId(items, itemId)!;
  const selectedBiome = byId(biomes, selected.stageBiomeId)!;
  const theme = { "--biome-accent": selectedBiome.theme.accent, "--biome-surface": selectedBiome.theme.surface } as CSSProperties;
  const recipe = recipes.find((entry) => entry.itemId === selected.id)!;
  const foodEffect = foodEffects.find((effect) => effect.itemId === selected.id);
  const upgradeCosts = buildUpgradeCostSummaries(recipe);
  const extensionGroup = stationExtensions.find((group) => group.stationItemId === selected.id);

  return <aside ref={detailRef} className="field-detail" style={theme} aria-label={`Detalle de ${selected.name.es}`}>
    <button className="field-back-results" onClick={onBackToResults}>← Volver a resultados</button>
    <header><span className="field-detail-icon" aria-hidden="true">{selected.icon}</span><div><p className="eyebrow">{selected.category} · {selectedBiome.theme.symbol} {selectedBiome.name.es}</p><h2>{selected.name.es}</h2><small>{selected.name.en}</small><p>{selected.description}</p></div></header>
    {foodEffect && <section className="field-block field-properties" aria-label="Propiedades del consumible">
      <div className="field-block-title"><h3>Propiedades</h3><span>{formatDuration(foodEffect.durationSeconds)}</span></div>
      <div className="field-stat-grid">
        {foodEffect.health && <Stat label="Salud" value={foodEffect.health} />}{foodEffect.stamina && <Stat label="Aguante" value={foodEffect.stamina} />}{foodEffect.eitr && <Stat label="Eitr" value={foodEffect.eitr} />}{foodEffect.healing && <Stat label="Curación" value={`${foodEffect.healing}/tick`} />}
      </div>
      {foodEffect.effects?.length && <ul className="field-effects">{foodEffect.effects.map((effect) => <li key={effect}>{effect}</li>)}</ul>}
    </section>}
    <section className="field-block"><div className="field-block-title"><h3>Fabricación</h3><span>{byId(stations, recipe.stationId)?.name.es}</span></div>
      <StationLevelRequirement stationId={recipe.stationId} stationLevel={recipe.craft.stationLevel} />
      {(recipe.outputAmount ?? 1) > 1 && <p className="field-output">Produce <strong>×{recipe.outputAmount}</strong></p>}
      {recipe.craft.materials.map((cost) => <Ingredient key={ingredientKey(cost)} cost={cost} onSelectItem={onSelectItem} />)}
    </section>
    <GoalPlanSection key={selected.id} itemId={selected.id} />
    {extensionGroup && <section className="field-block field-station-extensions" aria-label={`Extensiones de ${selected.name.es}`}>
      <div className="field-block-title"><h3>Mejoras de estación</h3><span>Nivel máximo {extensionGroup.maxLevel}</span></div><p>Cada extensión distinta cercana aumenta un nivel. El orden muestra la progresión habitual.</p>
      {extensionGroup.extensions.map((extension, index) => { const extensionItem = byId(items, extension.itemId)!; const extensionRecipe = recipes.find((entry) => entry.itemId === extension.itemId)!; return <details key={extension.itemId} className="field-extension-detail">
        <summary><b>Nivel {index + 2}</b><span aria-hidden="true">{extensionItem.icon}</span><span><strong>{extensionItem.name.es}</strong><small>{extensionItem.name.en}</small></span></summary>
        <div className="field-extension-materials"><p>Construcción · {byId(stations, extensionRecipe.stationId)?.name.es}</p>{extensionRecipe.craft.materials.map((cost) => <Ingredient key={ingredientKey(cost)} cost={cost} onSelectItem={onSelectItem} />)}<button className="field-related-link" onClick={() => onSelectItem(extension.itemId)}>Ver ficha de {extensionItem.name.es} →</button></div>
      </details>; })}
    </section>}
    {recipe.upgrades.length > 0 && <details className="field-block field-disclosure"><summary>Mejoras disponibles <span>{recipe.upgrades.length} niveles</span></summary>
      <section className="field-upgrade-total" aria-label={`Costo total desde nivel 1 hasta nivel ${upgradeCosts.at(-1)?.targetLevel}`}><div><p>Costo total acumulado</p><strong>Nivel 1 → Nivel {upgradeCosts.at(-1)?.targetLevel}</strong></div>{upgradeCosts.at(-1)?.cumulative.map((cost) => <Ingredient key={`maximum-${ingredientKey(cost)}`} cost={cost} onSelectItem={onSelectItem} />)}</section>
      {upgradeCosts.map((upgrade) => <section className="field-upgrade" key={upgrade.targetLevel}><h4>Mejora a nivel {upgrade.targetLevel}</h4><StationLevelRequirement stationId={recipe.stationId} stationLevel={recipe.upgrades.find((entry) => entry.targetLevel === upgrade.targetLevel)?.stationLevel ?? 1} /><p>Costo de este nivel</p>{upgrade.step.map((cost) => <Ingredient key={`step-${ingredientKey(cost)}`} cost={cost} onSelectItem={onSelectItem} />)}</section>)}
    </details>}
  </aside>;
}

function GoalPlanSection({ itemId }: { itemId: string }) {
  const recipe = recipes.find((entry) => entry.itemId === itemId)!;
  const [targetLevel, setTargetLevel] = useState(1);
  const goalPlan = buildGoalPlan(itemId, targetLevel);
  const collectionBiomes = namesForMaterials(goalPlan.materials.map((cost) => cost.materialId));
  const levels = [1, ...recipe.upgrades.map((upgrade) => upgrade.targetLevel)];
  return <details className="field-block field-plan field-disclosure" open><summary>Plan de objetivo <span>Materias primas</span></summary>
    {levels.length > 1 && <label className="field-goal-level"><span>OBJETIVO</span><select aria-label="Nivel objetivo" value={targetLevel} onChange={(event) => setTargetLevel(Number(event.target.value))}>{levels.map((level) => <option key={level} value={level}>{level === 1 ? "Sólo fabricar · Nivel 1" : level === levels.at(-1) ? `Hasta nivel máximo · ${level}` : `Hasta nivel ${level}`}</option>)}</select></label>}
    <div className="field-tags" aria-label="Estaciones necesarias">{goalPlan.stationIds.map((stationId) => <span key={stationId}>⚒ {byId(stations, stationId)?.name.es}</span>)}</div><div className="field-tags" aria-label="Biomas de recolección">{collectionBiomes.map((biome) => <span key={biome.id}>⌖ {biome.name.es}</span>)}</div>
    {goalPlan.materials.map((cost) => <Cost key={cost.materialId} materialId={cost.materialId} amount={cost.amount} />)}
  </details>;
}

function StationLevelRequirement({ stationId, stationLevel }: { stationId: string; stationLevel: number }) {
  const requirement = stationRequirement(stationId, stationLevel);
  if (!requirement) return null;
  return <details className="field-station-requirement"><summary>Requiere {byId(stations, stationId)?.name.es} nivel {stationLevel}</summary><p>Construí {requirement.extensionCount} {requirement.extensionCount === 1 ? "extensión distinta" : "extensiones distintas"} cerca de la estación.</p><ul>{requirement.group.extensions.map((extension) => <li key={extension.itemId}>{byId(items, extension.itemId)?.name.es}</li>)}</ul></details>;
}

function Cost({ materialId, amount }: { materialId: string; amount: number }) {
  const material = byId(materials, materialId)!;
  const materialSources = material.sourceIds.map((sourceId) => byId(sources, sourceId)).filter((source) => source !== undefined);
  const process = materialRecipes.find((entry) => entry.materialId === materialId);
  const batches = process ? Math.ceil(amount / process.outputAmount) : 0;
  return <details className="field-cost-detail"><summary className="field-cost"><span aria-hidden="true">{material.icon}</span><span><strong>{material.name.es}</strong><small>{material.name.en}</small></span><b>×{amount}</b></summary><div className="field-source-list">
    {process && <section className="field-material-process" aria-label={`Proceso de ${material.name.es}`}><div><strong>Proceso de fabricación</strong><small>{byId(stations, process.stationId)?.name.es} · produce ×{process.outputAmount} por lote</small><span>{batches} {batches === 1 ? "lote necesario" : "lotes necesarios"}</span></div><p>Para producir ×{amount}</p>{process.materials.map((cost) => <Cost key={`${materialId}-${cost.materialId}`} materialId={cost.materialId} amount={cost.amount * batches} />)}</section>}
    {materialSources.map((source) => <div key={source.id}><strong>{source.name.es}</strong><small>{source.name.en}</small><span>{source.biomeIds.map((biomeId) => byId(biomes, biomeId)?.name.es).filter(Boolean).join(" · ")}</span>{source.requirement && <em>Requisito: {source.requirement}</em>}</div>)}
  </div></details>;
}

type IngredientCost = { materialId: string; amount: number } | { itemId: string; amount: number };
function ingredientKey(cost: IngredientCost) { return "materialId" in cost ? `material-${cost.materialId}` : `item-${cost.itemId}`; }
function Ingredient({ cost, onSelectItem }: { cost: IngredientCost; onSelectItem: (itemId: string) => void }) {
  if ("materialId" in cost) return <Cost materialId={cost.materialId} amount={cost.amount} />;
  const item = byId(items, cost.itemId)!; const recipe = recipes.find((entry) => entry.itemId === cost.itemId)!;
  return <details className="field-cost-detail"><summary className="field-cost"><span aria-hidden="true">{item.icon}</span><span><strong>{item.name.es}</strong><small>{item.name.en} · objeto base</small></span><b>×{cost.amount}</b></summary><div className="field-source-list"><div><strong>Fabricación previa</strong><small>{byId(stations, recipe.stationId)?.name.es}</small><span>Se expande automáticamente en el Plan de objetivo.</span><button className="field-related-link" onClick={() => onSelectItem(item.id)}>Ver ficha de {item.name.es} →</button></div></div></details>;
}

function namesForMaterials(materialIds: string[]) { const biomeIds = new Set<string>(); materialIds.forEach((materialId) => byId(materials, materialId)?.sourceIds.forEach((sourceId) => byId(sources, sourceId)?.biomeIds.forEach((biomeId) => biomeIds.add(biomeId)))); return biomes.filter((biome) => biomeIds.has(biome.id)); }
function Stat({ label, value }: { label: string; value: string | number }) { return <div><small>{label}</small><strong>{value}</strong></div>; }
function formatDuration(seconds?: number) { if (!seconds) return "Duración no especificada"; if (seconds < 60) return `${seconds} s`; const minutes = Math.floor(seconds / 60); const remainder = seconds % 60; return remainder ? `${minutes} min ${remainder} s` : `${minutes} min`; }
