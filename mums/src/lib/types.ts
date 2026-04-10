// ── Recipe types (Supabase) ──────────────────────────────────

export type Recipe = {
  id: string;
  family_id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  category: string | null;
  image_url: string | null;
  source: string | null;
  servings: number | null;
  prep_time: number | null;
  cook_time: number | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type RecipeIngredient = {
  id: string;
  recipe_id: string;
  ingredient: string;
  amount: string | null;
  unit: string | null;
  sort_order: number;
};

export type RecipeWithIngredients = Recipe & {
  recipe_ingredients: RecipeIngredient[];
};
