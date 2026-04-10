"use client";

import type { Recipe } from "@/lib/types";
import RecipeCard from "./RecipeCard";

export default function RecipeGrid({
  recipes,
  onOpen,
  onToggleActive,
  showAll,
}: {
  recipes: Recipe[];
  onOpen: (id: string) => void;
  onToggleActive: (id: string, currentActive: boolean) => void;
  showAll: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {recipes.map((r) => (
        <RecipeCard
          key={r.id}
          recipe={r}
          onOpen={onOpen}
          onToggleActive={onToggleActive}
          showAll={showAll}
        />
      ))}
    </div>
  );
}
