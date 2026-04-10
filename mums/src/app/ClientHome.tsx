"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Header, { type SortOption } from "@/components/Header";
import RecipeGrid from "@/components/RecipeGrid";
import RecipeDetailModal from "@/components/RecipeDetailModal";
import { createClient } from "@/lib/supabase/client";
import type { Recipe, RecipeWithIngredients } from "@/lib/types";

export default function ClientHome() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [sort, setSort] = useState<SortOption>("title");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedRecipe, setSelectedRecipe] = useState<RecipeWithIngredients | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const [familyId, setFamilyId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 16;

  // Get user's family
  useEffect(() => {
    supabase.rpc("get_my_family_id").then(({ data }) => {
      if (data) setFamilyId(data);
    });
  }, [supabase]);

  // Fetch categories from existing recipes
  useEffect(() => {
    if (!familyId) return;

    supabase
      .from("recipes")
      .select("category")
      .eq("family_id", familyId)
      .not("category", "is", null)
      .then(({ data }) => {
        if (data) {
          const unique = Array.from(new Set(data.map((r) => r.category).filter(Boolean))) as string[];
          setCategories(unique.sort());
        }
      });
  }, [supabase, familyId]);

  // Fetch recipes with filters
  const fetchRecipes = useCallback(async () => {
    if (!familyId) return;

    setLoading(true);
    setError(null);

    try {
      const orderCol = sort === "updated_at_desc" ? "updated_at"
        : sort.startsWith("created_at") ? "created_at"
        : "title";
      const ascending = sort === "title" || sort === "created_at_asc";

      let q = supabase
        .from("recipes")
        .select("*")
        .eq("family_id", familyId)
        .order(orderCol, { ascending });

      if (!showAll) {
        q = q.eq("is_active", true);
      }

      if (category) {
        q = q.eq("category", category);
      }

      const trimmed = query.trim();

      if (trimmed) {
        q = q.ilike("title", `%${trimmed}%`);
      }

      const { data, error: err } = await q;
      if (err) throw err;

      let results = data ?? [];

      if (trimmed) {
        const { data: ingredientMatches } = await supabase
          .from("recipe_ingredients")
          .select("recipe_id")
          .ilike("ingredient", `%${trimmed}%`);

        if (ingredientMatches && ingredientMatches.length > 0) {
          const matchedIds = new Set(ingredientMatches.map((r) => r.recipe_id));
          const existingIds = new Set(results.map((r) => r.id));
          const missingIds = [...matchedIds].filter((id) => !existingIds.has(id));

          if (missingIds.length > 0) {
            let iq = supabase
              .from("recipes")
              .select("*")
              .eq("family_id", familyId)
              .in("id", missingIds);

            if (!showAll) iq = iq.eq("is_active", true);
            if (category) iq = iq.eq("category", category);

            const { data: extra } = await iq;
            if (extra) results = [...results, ...extra];
          }
        }

        results.sort((a, b) => {
          if (ascending) return a[orderCol].localeCompare(b[orderCol]);
          return b[orderCol].localeCompare(a[orderCol]);
        });
      }

      setRecipes(results);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Något gick fel");
    } finally {
      setLoading(false);
    }
  }, [supabase, familyId, query, category, showAll, sort]);

  useEffect(() => {
    const timer = setTimeout(fetchRecipes, 200);
    return () => clearTimeout(timer);
  }, [fetchRecipes]);

  // Toggle recipe active/inactive
  const toggleActive = async (id: string, currentActive: boolean) => {
    const { error: err } = await supabase
      .from("recipes")
      .update({ is_active: !currentActive })
      .eq("id", id);

    if (!err) {
      setRecipes((prev) =>
        prev.map((r) => (r.id === id ? { ...r, is_active: !currentActive } : r)),
      );
    }
  };

  // Open recipe detail modal
  const openRecipe = async (id: string) => {
    setDetailLoading(true);
    setModalOpen(true);

    const { data } = await supabase
      .from("recipes")
      .select("*, recipe_ingredients(*)") 
      .eq("id", id)
      .order("sort_order", { referencedTable: "recipe_ingredients" })
      .single();

    if (data) {
      setSelectedRecipe(data as unknown as RecipeWithIngredients);
    }
    setDetailLoading(false);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedRecipe(null);
  };

  // Sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const totalPages = Math.max(1, Math.ceil(recipes.length / PAGE_SIZE));
  const paginatedRecipes = useMemo(
    () => recipes.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [recipes, page],
  );

  const emptyState = useMemo(() => {
    if (loading) return null;
    if (error) return null;
    if (recipes.length === 0 && !query.trim() && !category) {
      return "Inga recept än. Lägg till ditt första familjerecept!";
    }
    if (recipes.length === 0) return "Inga recept matchade sökningen.";
    return null;
  }, [loading, error, recipes.length, query, category]);

  return (
    <div>
      <Header
        query={query}
        onQueryChange={(v) => { setQuery(v); setPage(1); }}
        categories={categories}
        categoryValue={category}
        onCategoryChange={(v) => { setCategory(v); setPage(1); }}
        showAll={showAll}
        onToggleShowAll={() => setShowAll((p) => !p)}
        onAddRecipe={() => router.push("/add")}
        onSignOut={handleSignOut}
        sort={sort}
        onSortChange={(v) => { setSort(v); setPage(1); }}
      />

      <main className="mx-auto max-w-6xl px-4 py-6">
        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-100">
            {error}
          </div>
        )}

        {loading && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[4/5] animate-pulse rounded-3xl bg-zinc-100 dark:bg-zinc-800"
              />
            ))}
          </div>
        )}

        {emptyState && !loading && (
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm text-zinc-600 dark:text-zinc-300">{emptyState}</p>
            {recipes.length === 0 && !query.trim() && !category && (
              <button
                type="button"
                onClick={() => router.push("/add")}
                className="rounded-2xl border border-zinc-900 bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                + Lägg till recept
              </button>
            )}
          </div>
        )}

        {!loading && recipes.length > 0 && (
          <>
            <RecipeGrid
              recipes={paginatedRecipes}
              onOpen={openRecipe}
              onToggleActive={toggleActive}
              showAll={showAll}
            />

            {totalPages > 1 && (
              <nav className="mt-6 flex items-center justify-center gap-1">
                <button
                  type="button"
                  onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  disabled={page === 1}
                  className="rounded-xl px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 disabled:pointer-events-none disabled:opacity-30 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  ← Föregående
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                    className={[
                      "min-w-[2.25rem] rounded-xl px-2 py-2 text-sm font-medium transition-colors",
                      p === page
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800",
                    ].join(" ")}
                  >
                    {p}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                  disabled={page === totalPages}
                  className="rounded-xl px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 disabled:pointer-events-none disabled:opacity-30 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  Nästa →
                </button>
              </nav>
            )}

            <p className="mt-3 text-center text-xs text-zinc-400 dark:text-zinc-500">
              {recipes.length} recept{totalPages > 1 && ` · sida ${page} av ${totalPages}`}
            </p>
          </>
        )}
      </main>

      <RecipeDetailModal
        open={modalOpen}
        recipe={selectedRecipe}
        loading={detailLoading}
        onClose={closeModal}
      />
    </div>
  );
}
