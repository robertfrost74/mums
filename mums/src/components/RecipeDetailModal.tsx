"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import type { RecipeWithIngredients } from "@/lib/types";
import { scaleAmount, parseSteps } from "@/lib/recipeUtils";

type ImageState = { url: string | null; finding: boolean };

type TabKey = "ingredients" | "instructions" | "cooking";

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])';

export default function RecipeDetailModal({
  open,
  recipe,
  loading,
  onClose,
}: {
  open: boolean;
  recipe: RecipeWithIngredients | null;
  loading: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("ingredients");
  const [copied, setCopied] = useState(false);
  const [img, setImg] = useState<ImageState>({ url: null, finding: false });
  const dialogRef = useRef<HTMLDivElement>(null);

  const [portionScale, setPortionScale] = useState(1);
  const [cookingStep, setCookingStep] = useState(0);

  const steps = parseSteps(recipe?.instructions ?? null);

  useEffect(() => {
    if (open) {
      setTab("ingredients");
      setImg({ url: null, finding: false });
      setPortionScale(1);
      setCookingStep(0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab" && dialogRef.current) {
        const els = dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
        if (els.length === 0) return;
        const first = els[0];
        const last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handleKeyDown]);

  const handleFindImage = useCallback(async () => {
    if (!recipe) return;
    setImg((prev) => ({ ...prev, finding: true }));
    try {
      const res = await fetch("/api/find-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: recipe.title, recipeId: recipe.id }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setImg({ url: data.url, finding: false });
      } else {
        setImg((prev) => ({ ...prev, finding: false }));
      }
    } catch {
      setImg((prev) => ({ ...prev, finding: false }));
    }
  }, [recipe]);

  const onShare = async () => {
    if (!recipe) return;
    const url = `${window.location.origin}/recipe/${recipe.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: recipe.title, url });
        return;
      }
    } catch {
      /* user cancelled */
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Kopiera länken:", url);
    }
  };

  const onPrint = () => {
    if (!recipe) return;
    onClose();
    router.push(`/recipe/${recipe.id}`);
  };

  const tabBtn =
    "flex-1 rounded-2xl border px-3 py-2 text-sm shadow-sm transition-colors duration-150";
  const tabInactive =
    "border-zinc-200 bg-white hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800";
  const tabActive = "border-zinc-300 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800";
  const actionBtn =
    "rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm shadow-sm transition-colors duration-150 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800";

  const ingredients = recipe?.recipe_ingredients ?? [];
  const DEFAULT_SERVINGS = 4;
  const hasExplicitServings = recipe?.servings != null && recipe.servings > 0;
  const baseServings = hasExplicitServings ? recipe!.servings! : DEFAULT_SERVINGS;

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
            aria-label="Stäng"
            type="button"
          />

          <div ref={dialogRef} className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2">
            <motion.div
              className="w-[min(920px,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 10 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-center justify-end gap-2 border-b border-zinc-200 p-4 dark:border-zinc-800">
                <button onClick={onPrint} className={actionBtn} type="button" title="Skriv ut">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
                </button>
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

              {recipe && !loading && (
                <div className="max-h-[78vh] overflow-y-auto p-4">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-3">
                      {recipe.image_url || img.url ? (
                        <div className="relative aspect-[16/11] overflow-hidden rounded-2xl">
                          <Image
                            src={(img.url || recipe.image_url)!}
                            alt={recipe.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 45vw"
                          />
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleFindImage}
                          disabled={img.finding}
                          className="flex aspect-[16/11] w-full flex-col items-center justify-center gap-3 rounded-2xl bg-zinc-100 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                        >
                          {img.finding ? (
                            <>
                              <svg className="h-8 w-8 animate-spin text-zinc-400" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                              <span className="text-sm text-zinc-500 dark:text-zinc-400">Söker bild…</span>
                            </>
                          ) : (
                            <>
                              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Hitta bild</span>
                            </>
                          )}
                        </button>
                      )}

                      <div className="flex flex-wrap items-center gap-2">
                        {recipe.category && (
                          <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs dark:border-zinc-800 dark:bg-zinc-900">
                            {recipe.category}
                          </span>
                        )}
                        <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs dark:border-zinc-800 dark:bg-zinc-900">
                          {Math.round(baseServings * portionScale)} portioner{!hasExplicitServings && " (uppsk.)"}
                        </span>
                        {recipe.prep_time != null && recipe.prep_time > 0 && (
                          <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs dark:border-zinc-800 dark:bg-zinc-900">
                            Förb: {recipe.prep_time} min
                          </span>
                        )}
                        {recipe.cook_time != null && recipe.cook_time > 0 && (
                          <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs dark:border-zinc-800 dark:bg-zinc-900">
                            Tillagning: {recipe.cook_time} min
                          </span>
                        )}
                      </div>

                      {/* Portion scaler */}
                      <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
                        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Portioner:</span>
                        <button
                          type="button"
                          onClick={() => setPortionScale((s) => Math.max(0.25, s - 0.5))}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-300 text-sm font-bold transition-colors hover:bg-zinc-200 dark:border-zinc-700 dark:hover:bg-zinc-800"
                        >
                          −
                        </button>
                        <span className="min-w-[3rem] text-center text-sm font-semibold">
                          {Math.round(baseServings * portionScale)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPortionScale((s) => s + 0.5)}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-300 text-sm font-bold transition-colors hover:bg-zinc-200 dark:border-zinc-700 dark:hover:bg-zinc-800"
                        >
                          +
                        </button>
                        {portionScale !== 1 && (
                          <button
                            type="button"
                            onClick={() => setPortionScale(1)}
                            className="ml-1 text-xs text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
                          >
                            Återställ
                          </button>
                        )}
                        {!hasExplicitServings && portionScale === 1 && (
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500">uppsk.</span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            router.push(`/edit/${recipe.id}`);
                          }}
                          className={actionBtn}
                        >
                          Redigera
                        </button>
                        <button onClick={onShare} className={actionBtn} type="button">
                          Dela
                        </button>
                      </div>

                      {recipe.source && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Källa: {recipe.source}
                        </p>
                      )}
                    </div>

                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold leading-tight tracking-tight md:text-2xl">
                        {recipe.title}
                      </h2>

                      {recipe.description && (
                        <p className="text-sm text-zinc-600 dark:text-zinc-300">
                          {recipe.description}
                        </p>
                      )}

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
                        {steps.length > 1 && (
                          <button
                            type="button"
                            onClick={() => { setTab("cooking"); setCookingStep(0); }}
                            className={[tabBtn, tab === "cooking" ? tabActive : tabInactive].join(" ")}
                          >
                            Laga 👨‍🍳
                          </button>
                        )}
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
                                    Inga ingredienser tillagda.
                                  </li>
                                ) : (
                                  ingredients.map((x) => (
                                    <li key={x.id} className="flex items-baseline justify-between gap-6 text-sm">
                                      <span className="font-medium">{x.ingredient}</span>
                                      <span className="text-zinc-500 dark:text-zinc-400">
                                        {[scaleAmount(x.amount, portionScale), x.unit].filter(Boolean).join(" ")}
                                      </span>
                                    </li>
                                  ))
                                )}
                              </ul>
                            </motion.div>
                          ) : tab === "instructions" ? (
                            <motion.div
                              key="instructions"
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 6 }}
                              transition={{ duration: 0.15 }}
                            >
                              <h3 className="text-lg font-semibold tracking-tight">Instruktioner</h3>
                              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-zinc-700 dark:text-zinc-200">
                                {recipe.instructions ?? "Inga instruktioner."}
                              </p>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="cooking"
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 6 }}
                              transition={{ duration: 0.15 }}
                              className="flex h-full flex-col"
                            >
                              <div className="mb-2 flex items-center justify-between">
                                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                  Steg {cookingStep + 1} av {steps.length}
                                </span>
                                <div className="flex gap-1">
                                  {steps.map((_, i) => (
                                    <button
                                      key={i}
                                      type="button"
                                      onClick={() => setCookingStep(i)}
                                      className={[
                                        "h-2 rounded-full transition-all",
                                        i === cookingStep
                                          ? "w-6 bg-zinc-900 dark:bg-zinc-100"
                                          : i < cookingStep
                                            ? "w-2 bg-zinc-400 dark:bg-zinc-500"
                                            : "w-2 bg-zinc-200 dark:bg-zinc-700",
                                      ].join(" ")}
                                    />
                                  ))}
                                </div>
                              </div>

                              <AnimatePresence mode="wait">
                                <motion.div
                                  key={cookingStep}
                                  initial={{ opacity: 0, x: 20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: -20 }}
                                  transition={{ duration: 0.2 }}
                                  className="flex flex-1 items-start py-6"
                                >
                                  <p className="text-sm leading-6 text-zinc-800 dark:text-zinc-100">
                                    {steps[cookingStep]}
                                  </p>
                                </motion.div>
                              </AnimatePresence>

                              <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                                <button
                                  type="button"
                                  onClick={() => setCookingStep((s) => Math.max(0, s - 1))}
                                  disabled={cookingStep === 0}
                                  className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm transition-colors hover:bg-zinc-100 disabled:opacity-30 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                                >
                                  ← Föregående
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setCookingStep((s) => Math.min(steps.length - 1, s + 1))}
                                  disabled={cookingStep === steps.length - 1}
                                  className="rounded-2xl border border-zinc-900 bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-30 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                                >
                                  Nästa →
                                </button>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <AnimatePresence>
                {copied && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="pointer-events-none fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-zinc-900 px-4 py-2 text-sm text-white shadow-lg dark:bg-zinc-800"
                  >
                    Länk kopierad
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
