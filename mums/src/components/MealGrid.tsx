"use client";

import type { MealSummary, FavoriteMeal } from "@/lib/types";
import MealCard from "./MealCard";

export default function MealGrid({
  meals,
  categoryLabel,
  onOpen,
  isFavorite,
  onToggleFavorite,
}: {
  meals: MealSummary[];
  categoryLabel?: string;
  onOpen: (id: string) => void;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (m: FavoriteMeal) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {meals.map((m) => (
        <MealCard
          key={m.idMeal}
          meal={m}
          categoryLabel={categoryLabel}
          onOpen={onOpen}
          isFavorite={isFavorite(m.idMeal)}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  );
}