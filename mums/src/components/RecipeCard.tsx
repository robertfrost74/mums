"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import type { Recipe } from "@/lib/types";

export default function RecipeCard({
  recipe,
  onOpen,
  onToggleActive,
  showAll,
}: {
  recipe: Recipe;
  onOpen: (id: string) => void;
  onToggleActive: (id: string, currentActive: boolean) => void;
  showAll: boolean;
}) {
  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      className={[
        "group relative overflow-hidden rounded-3xl border shadow-sm",
        recipe.is_active
          ? "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
          : "border-zinc-200/60 bg-zinc-50 opacity-60 dark:border-zinc-800/60 dark:bg-zinc-900/60",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={() => onOpen(recipe.id)}
        className="block w-full text-left"
        aria-label={`Öppna ${recipe.title}`}
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
          {recipe.image_url ? (
            <Image
              src={recipe.image_url}
              alt={recipe.title}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-4xl text-zinc-300 dark:text-zinc-600">
              🍽
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="text-sm font-semibold tracking-tight">{recipe.title}</div>
          {recipe.category && (
            <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{recipe.category}</div>
          )}
          {recipe.source && (
            <div className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">{recipe.source}</div>
          )}
        </div>
      </button>

      {showAll && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleActive(recipe.id, recipe.is_active);
          }}
          className={[
            "absolute right-3 top-3 z-10 rounded-2xl border px-3 py-2 text-xs font-medium shadow-sm transition-colors duration-150",
            recipe.is_active
              ? "border-emerald-200 bg-emerald-50/90 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200 dark:hover:bg-emerald-900/70"
              : "border-zinc-300 bg-white/90 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-300 dark:hover:bg-zinc-800",
          ].join(" ")}
          aria-label={recipe.is_active ? "Inaktivera recept" : "Aktivera recept"}
        >
          {recipe.is_active ? "Aktiv" : "Inaktiv"}
        </button>
      )}
    </motion.div>
  );
}
