"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import MealGrid from "@/components/MealGrid";
import MealDetailModal from "@/components/MealDetailModal";
import FavoritesPanel from "@/components/FavoritesPanel";
import { useFavorites } from "@/hooks/useFavorites";
import type { MealSummary } from "@/lib/types";
import { buildQuery } from "@/lib/urlState";
import { filterMealsByCategory, listCategories, randomMeal, searchMealsByName } from "@/lib/themealdb";

type CategoryLite = { strCategory: string };

export default function Page() {
  const router = useRouter();
  const sp = useSearchParams();

  const initialQ = sp.get("q") ?? "";
  const initialCat = sp.get("cat") ?? "";

  const [query, setQuery] = useState(initialQ);
  const [category, setCategory] = useState(initialCat);

  const [categories, setCategories] = useState<CategoryLite[]>([]);
  const [meals, setMeals] = useState<MealSummary[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [openMealId, setOpenMealId] = useState<string>("");
  const [favoritesOpen, setFavoritesOpen] = useState(false);

  const { list: favorites, isFavorite, toggleFavorite } = useFavorites();

  // Keep state in sync when user navigates back/forward
  useEffect(() => {
    const q = sp.get("q") ?? "";
    const c = sp.get("cat") ?? "";
    setQuery(q);
    setCategory(c);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp]);

  // Load categories once
  useEffect(() => {
    const ac = new AbortController();
    listCategories(ac.signal)
      .then((res) => setCategories((res.categories ?? []).map((x) => ({ strCategory: x.strCategory }))))
      .catch(() => setCategories([]));
    return () => ac.abort();
  }, []);

  // Update URL when query/category changes (debounced for query)
  useEffect(() => {
    const t = setTimeout(() => {
      router.replace(buildQuery({ q: query.trim() || undefined, cat: category || undefined }), { scroll: false });
    }, 250);
    return () => clearTimeout(t);
  }, [query, category, router]);

  // Fetch meals whenever state changes
  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setError(null);

    const run = async () => {
      // Priority: category filter if selected; else search if query; else show empty
      if (category) {
        const r = await filterMealsByCategory(category, ac.signal);
        setMeals(r.meals ?? []);
        return;
      }
      if (query.trim()) {
        const r = await searchMealsByName(query, ac.signal);
        // search returns full Meal objects; map to summary shape
        const mapped =
          (r.meals ?? []).map((m) => ({
            idMeal: m.idMeal,
            strMeal: m.strMeal,
            strMealThumb: m.strMealThumb,
          })) ?? [];
        setMeals(mapped);
        return;
      }
      setMeals([]);
    };

    run()
      .catch((e: unknown) => {
        if (ac.signal.aborted) return;
        setError(e instanceof Error ? e.message : "Något gick fel");
      })
      .finally(() => {
        if (ac.signal.aborted) return;
        setLoading(false);
      });

    return () => ac.abort();
  }, [query, category]);

  const emptyState = useMemo(() => {
    if (loading) return null;
    if (error) return null;
    if (!query.trim() && !category) return "Sök efter en rätt eller välj en kategori.";
    if (meals.length === 0) return "Inga resultat. Prova ett annat sökord eller kategori.";
    return null;
  }, [loading, error, query, category, meals.length]);

  const onRandom = async () => {
    try {
      setLoading(true);
      setError(null);
      const r = await randomMeal();
      const m = r.meals?.[0];
      if (m?.idMeal) setOpenMealId(m.idMeal);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Något gick fel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Header
        query={query}
        onQueryChange={(v) => setQuery(v)}
        categories={categories}
        categoryValue={category}
        onCategoryChange={(v) => setCategory(v)}
        onRandom={onRandom}
        favoritesCount={favorites.length}
        onOpenFavorites={() => setFavoritesOpen(true)}
      />

      <main className="mx-auto max-w-6xl px-4 py-6">
        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-100">
            Något gick fel: {error}
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[4/5] animate-pulse rounded-3xl bg-zinc-100 dark:bg-zinc-800" />
            ))}
          </div>
        )}

        {emptyState && !loading && (
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            {emptyState}
          </div>
        )}

        {!loading && meals.length > 0 && (
          <MealGrid
            meals={meals}
            categoryLabel={category || undefined}
            onOpen={(id) => setOpenMealId(id)}
            isFavorite={isFavorite}
            onToggleFavorite={toggleFavorite}
          />
        )}
      </main>

      <MealDetailModal
        open={Boolean(openMealId)}
        mealId={openMealId}
        onClose={() => setOpenMealId("")}
        isFavorite={isFavorite}
        onToggleFavorite={toggleFavorite}
      />

      <FavoritesPanel
        open={favoritesOpen}
        favorites={favorites}
        onClose={() => setFavoritesOpen(false)}
        onOpenMeal={(id) => {
          setFavoritesOpen(false);
          setOpenMealId(id);
        }}
        onRemoveFavorite={toggleFavorite}
      />
    </div>
  );
}