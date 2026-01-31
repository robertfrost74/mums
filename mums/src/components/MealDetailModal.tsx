"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import type { Meal, FavoriteMeal } from "@/lib/types";
import { lookupMealById } from "@/lib/themealdb";
import { getIngredients } from "@/lib/ingredients";

type TabKey = "ingredients" | "instructions";

export default function MealDetailModal({
  open,
  mealId,
  onClose,
  isFavorite,
  onToggleFavorite,
}: {
  open: boolean;
  mealId: string;
  onClose: () => void;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (meal: FavoriteMeal) => void;
}) {
  const [meal, setMeal] = useState<Meal | null>(null);
  const [tab, setTab] = useState<TabKey>("ingredients");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const favPayload = useMemo<FavoriteMeal | null>(() => {
    if (!meal) return null;
    return { idMeal: meal.idMeal, strMeal: meal.strMeal, strMealThumb: meal.strMealThumb };
  }, [meal]);

  const ingredients = useMemo(() => (meal ? getIngredients(meal) : []), [meal]);
  const fav = meal ? isFavorite(meal.idMeal) : false;

  useEffect(() => {
    if (!open) return;
    setTab("ingredients");
  }, [open, mealId]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !mealId) return;
    const ac = new AbortController();

    setLoading(true);
    setError(null);
    setMeal(null);

    lookupMealById(mealId, ac.signal)
      .then((res) => {
        const m = res.meals?.[0] ?? null;
        setMeal(m);
        if (!m) setError("Receptet hittades inte.");
      })
      .catch((e: unknown) => {
        if (ac.signal.aborted) return;
        setError(e instanceof Error ? e.message : "Något gick fel");
      })
      .finally(() => {
        if (ac.signal.aborted) return;
        setLoading(false);
      });

    return () => ac.abort();
  }, [open, mealId]);

  const tabBtn =
    "flex-1 rounded-2xl border px-3 py-2 text-sm shadow-sm transition-colors duration-150";
  const tabInactive =
    "border-zinc-200 bg-white hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800";
  const tabActive = "border-zinc-300 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800";

  const actionBtn =
    "rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm shadow-sm transition-colors duration-150 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800";

  const onShare = async () => {
    if (!meal) return;

    // Preserve existing q/cat and ensure meal is present
    const params = new URLSearchParams(window.location.search);
    params.set("meal", meal.idMeal);

    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;

    // Prefer native share if available (mobile UX)
    try {
      // @ts-expect-error - share exists in supported browsers
      if (navigator.share) {
        // @ts-expect-error - share exists in supported browsers
        await navigator.share({ title: meal.strMeal, url });
        return;
      }
    } catch {
      // ignore and fallback to clipboard
    }

    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Kopiera länken:", url);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
            aria-label="Close meal"
            type="button"
          />

          <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2">
            <motion.div
              className="w-[min(920px,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800">
                <div className="text-base font-semibold tracking-tight">Recept</div>
                <button onClick={onClose} className={actionBtn} type="button">
                  Stäng
                </button>
              </div>

              {loading && (
                <div className="p-4">
                  <div className="aspect-[16/9] w-full animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
                  <div className="mt-4 h-5 w-1/2 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                  <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
                </div>
              )}

              {error && !loading && (
                <div className="p-4">
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-100">
                    Något gick fel: {error}
                  </div>
                </div>
              )}

              {meal && !loading && !error && (
                <div className="max-h-[78vh] overflow-y-auto p-4">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-3">
                      <div className="relative aspect-[16/11] overflow-hidden rounded-2xl">
                        <Image
                          src={meal.strMealThumb}
                          alt={meal.strMeal}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 45vw"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {meal.strCategory && (
                          <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs dark:border-zinc-800 dark:bg-zinc-900">
                            {meal.strCategory}
                          </span>
                        )}
                        {meal.strArea && (
                          <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs dark:border-zinc-800 dark:bg-zinc-900">
                            {meal.strArea}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => favPayload && onToggleFavorite(favPayload)}
                          className={actionBtn}
                          type="button"
                        >
                          {fav ? "★ Favorit" : "☆ Spara favorit"}
                        </button>

                        <button onClick={onShare} className={actionBtn} type="button">
                          🔗 Dela
                        </button>

                        {meal.strYoutube && (
                          <a
                            href={meal.strYoutube}
                            target="_blank"
                            rel="noreferrer"
                            className={actionBtn}
                          >
                            ▶️ YouTube
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h2 className="text-xl md:text-2xl font-semibold leading-tight tracking-tight">
                          {meal.strMeal}
                        </h2>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setTab("ingredients")}
                          className={[tabBtn, tab === "ingredients" ? tabActive : tabInactive].join(" ")}
                        >
                          Ingredienser
                        </button>
                        <button
                          type="button"
                          onClick={() => setTab("instructions")}
                          className={[tabBtn, tab === "instructions" ? tabActive : tabInactive].join(" ")}
                        >
                          Instruktioner
                        </button>
                      </div>

                      <div className="min-h-[280px] max-h-[280px] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 md:min-h-[420px] md:max-h-[420px]">
                        <AnimatePresence mode="wait" initial={false}>
                          {tab === "ingredients" ? (
                            <motion.div
                              key="ingredients"
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 6 }}
                              transition={{ duration: 0.15 }}
                            >
                              <h3 className="text-lg font-semibold tracking-tight">Ingredienser</h3>

                              <ul className="mt-3 space-y-3">
                                {ingredients.length === 0 ? (
                                  <li className="text-sm text-zinc-500 dark:text-zinc-400">
                                    Inga ingredienser hittades.
                                  </li>
                                ) : (
                                  ingredients.map((x) => (
                                    <li
                                      key={`${x.ingredient}-${x.measure}`}
                                      className="flex items-baseline justify-between gap-6 text-sm"
                                    >
                                      <span className="font-medium">{x.ingredient}</span>
                                      <span className="text-zinc-500 dark:text-zinc-400">{x.measure}</span>
                                    </li>
                                  ))
                                )}
                              </ul>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="instructions"
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 6 }}
                              transition={{ duration: 0.15 }}
                            >
                              <h3 className="text-lg font-semibold tracking-tight">Instruktioner</h3>

                              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-zinc-700 dark:text-zinc-200">
                                {meal.strInstructions ?? "Inga instruktioner."}
                              </p>

                              {meal.strSource && (
                                <div className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
                                  Källa:{" "}
                                  <a
                                    href={meal.strSource}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="underline underline-offset-2"
                                  >
                                    {meal.strSource}
                                  </a>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}