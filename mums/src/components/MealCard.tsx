"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { FavoriteMeal, MealSummary } from "@/lib/types";

export default function MealCard({
  meal,
  categoryLabel,
  onOpen,
  isFavorite,
  onToggleFavorite,
}: {
  meal: MealSummary;
  categoryLabel?: string;
  onOpen: (id: string) => void;
  isFavorite: boolean;
  onToggleFavorite: (m: FavoriteMeal) => void;
}) {
  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      className="group relative overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <button
        type="button"
        onClick={() => onOpen(meal.idMeal)}
        className="block w-full text-left"
        aria-label={`Open ${meal.strMeal}`}
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <Image
            src={meal.strMealThumb}
            alt={meal.strMeal}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </div>

        <div className="p-4">
          <div className="text-sm font-semibold tracking-tight">{meal.strMeal}</div>
          {categoryLabel && (
            <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{categoryLabel}</div>
          )}
        </div>
      </button>

      {/* Favorite button is NOT inside the main button (avoids nested button warning) */}
      <button
        type="button"
        onClick={() =>
          onToggleFavorite({
            idMeal: meal.idMeal,
            strMeal: meal.strMeal,
            strMealThumb: meal.strMealThumb,
          })
        }
        className="absolute right-3 top-3 z-10 rounded-2xl border border-zinc-200 bg-white/90 px-3 py-2 text-sm shadow-sm transition-colors duration-150 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950/70 dark:hover:bg-zinc-800"
        aria-label={isFavorite ? "Remove favorite" : "Add favorite"}
      >
        {isFavorite ? "★" : "☆"}
      </button>
    </motion.div>
  );
}