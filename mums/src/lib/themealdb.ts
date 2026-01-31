import type { ApiList, Category, Meal, MealSummary } from "./types";

const BASE = "https://www.themealdb.com/api/json/v1/1";

async function http<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal, cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

export function listCategories(signal?: AbortSignal) {
  return http<ApiList<Category>>(`${BASE}/categories.php`, signal);
}

export function searchMealsByName(q: string, signal?: AbortSignal) {
  const query = encodeURIComponent(q.trim());
  return http<ApiList<Meal>>(`${BASE}/search.php?s=${query}`, signal);
}

export function filterMealsByCategory(cat: string, signal?: AbortSignal) {
  const c = encodeURIComponent(cat.trim());
  return http<ApiList<MealSummary>>(`${BASE}/filter.php?c=${c}`, signal);
}

export function lookupMealById(id: string, signal?: AbortSignal) {
  const mid = encodeURIComponent(id);
  return http<ApiList<Meal>>(`${BASE}/lookup.php?i=${mid}`, signal);
}

export function randomMeal(signal?: AbortSignal) {
  return http<ApiList<Meal>>(`${BASE}/random.php`, signal);
}