import type { Meal } from "./types";

export function getIngredients(meal: Meal) {
  const out: { ingredient: string; measure: string }[] = [];

  for (let i = 1; i <= 20; i++) {
    const ing = (meal[`strIngredient${i}`] ?? "").trim();
    const meas = (meal[`strMeasure${i}`] ?? "").trim();
    if (!ing) continue;
    out.push({ ingredient: ing, measure: meas });
  }

  return out;
}