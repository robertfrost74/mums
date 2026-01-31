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
import {
  filterMealsByCategory,
  listCategories,
  randomMeal,
  searchMealsByName,
} from "@/lib/themealdb";

type CategoryLite = { strCategory: string };

export default function ClientHome() {
  const router = useRouter();
  const sp = useSearchParams();

  const initialQ = sp.get("q") ?? "";
  const initialCat = sp.get("cat") ?? "";
  const initialMeal = sp.get("meal") ?? "";

  const [query, setQuery] = useState(initialQ);
  const [category, setCategory] = useState(initialCat);

  const [categories, setCategories] = useState<CategoryLite[]>([]);
  const [meals, setMeals] = useState<MealSummary[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [openMealId, setOpenMealId] = useState(initialMeal);
  const [favoritesOpen, setFavoritesOpen] = useState(false);

  const { list: favorites, isFavorite, toggleFavorite } = useFavorites();

  // Sync state from URL on back/forward
  useEffect(() => {
    const q = sp.get("q") ?? "";
    const c = sp.get("cat") ?? "";
    const m = sp.get("meal") ?? "";
    setQuery(q);
    setCategory(c);
    setOpenMealId(m);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp]);

  const openMeal = (id: string) => {
    setOpenMealId(id);
    router.replace(
      buildQuery({
        q: query.trim() || undefined,
        cat: category || undefined,
        meal: id,
      }),
      { scroll: false }
    );
  };

  const closeMeal = () => {
    setOpenMealId("");
    router.replace(
      buildQuery({
        q: query.trim() || undefined,
        cat: category || undefined,
      }),
      { scroll: false }
    );
  };

  // Load categories once
  useEffect(() => {
    const ac = new AbortController();
    listCategories(ac.signal)
      .then((res) =>
        setCategories((res.categories ?? []).map((x) => ({ strCategory: x.strCategory })))
      )
      .catch(() => setCategories([]));
    return () => ac.abort();
  }, []);

  // Update URL for q/cat/meal changes (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      router.replace(
        buildQuery({
          q: query.trim() || undefined,
          cat: category || undefined,
          meal: openMealId || undefined,
        }),
        { scroll: false }
      );
    }, 250);

    return () => clearTimeout(t);
  }, [query, category, openMealId, router]);

  // Fetch meals
  useEffect(() => {
    const ac = new AbortController();
    setLoading(true);
    setError(null);

    const run = async () => {
      const q = query.trim();

      // combined: category + query => client-side filter within category list
      if (category && q) {
        const r = await filterMealsByCategory(category, ac.signal);
        const list = r.meals ?? [];
        const filtered = list.filter((m) => m.strMeal.toLowerCase().includes(q.toLowerCase()));
        setMeals(filtered);
        return;
      }

      if (category) {
        const r = await filterMealsByCategory(category, ac.signal);
        setMeals(r.meals ?? []);
        return;
      }

      if (q) {
        const r = await searchMealsByName(q, ac.signal);
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
      if (m?.idMeal) openMeal(m.idMeal);
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
            onOpen={(id) => openMeal(id)}
            isFavorite={isFavorite}
            onToggleFavorite={toggleFavorite}
          />
        )}
      </main>

      <MealDetailModal
        open={Boolean(openMealId)}
        mealId={openMealId}
        onClose={closeMeal}
        isFavorite={isFavorite}
        onToggleFavorite={toggleFavorite}
      />

      <FavoritesPanel
        open={favoritesOpen}
        favorites={favorites}
        onClose={() => setFavoritesOpen(false)}
        onOpenMeal={(id) => {
          setFavoritesOpen(false);
          openMeal(id);
        }}
        onRemoveFavorite={toggleFavorite}
      />
    </div>
  );
}
