"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import type { FavoriteMeal } from "@/lib/types";

export default function FavoritesPanel({
  open,
  favorites,
  onClose,
  onOpenMeal,
  onRemoveFavorite,
}: {
  open: boolean;
  favorites: FavoriteMeal[];
  onClose: () => void;
  onOpenMeal: (id: string) => void;
  onRemoveFavorite: (meal: FavoriteMeal) => void;
}) {
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
            type="button"
            onClick={onClose}
            aria-label="Close favorites"
          />

          <motion.aside
            initial={{ x: 24, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 24, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="fixed right-4 top-4 z-50 w-[min(440px,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800">
              <div className="text-base font-semibold tracking-tight">Favoriter</div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors duration-150 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              >
                Stäng
              </button>
            </div>

            <div className="max-h-[72vh] overflow-y-auto p-4">
              {favorites.length === 0 ? (
                <div className="text-sm text-zinc-500 dark:text-zinc-400">
                  Inga favoriter ännu.
                </div>
              ) : (
                <div className="space-y-3">
                  {favorites.map((m) => (
                    <div
                      key={m.idMeal}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 p-3 dark:border-zinc-800"
                    >
                      <button
                        type="button"
                        onClick={() => onOpenMeal(m.idMeal)}
                        className="flex min-w-0 items-center gap-3 text-left"
                        aria-label={`Open favorite ${m.strMeal}`}
                      >
                        <div className="relative h-12 w-12 flex-none overflow-hidden rounded-xl">
                          <Image
                            src={m.strMealThumb}
                            alt={m.strMeal}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{m.strMeal}</div>
                          <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                            Klicka för detaljer
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => onRemoveFavorite(m)}
                        className="flex-none rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors duration-150 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                        aria-label="Remove favorite"
                        title="Ta bort favorit"
                      >
                        ★
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}