"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { RecipeWithIngredients } from "@/lib/types";

export default function RecipePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [recipe, setRecipe] = useState<RecipeWithIngredients | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;

    supabase
      .from("recipes")
      .select("*, recipe_ingredients(*)")
      .eq("id", id)
      .order("sort_order", { referencedTable: "recipe_ingredients" })
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true);
        } else {
          setRecipe(data as unknown as RecipeWithIngredients);
        }
        setLoading(false);
      });
  }, [id, supabase]);

  const ingredients = recipe?.recipe_ingredients ?? [];

  if (loading) {
    return (
      <div className="min-h-dvh">
        <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70">
          <div className="mx-auto flex max-w-3xl items-center justify-center px-4 py-3">
            <Link href="/" className="flex items-center gap-3">
              <Image src="/mums-logo.svg" alt="Mums" width={80} height={20} className="h-6 w-auto dark:hidden" />
              <Image src="/mums-logo-dark.svg" alt="Mums" width={80} height={20} className="hidden h-6 w-auto dark:block" />
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-8">
          <div className="space-y-4">
            <div className="aspect-[16/9] w-full animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-8 w-2/3 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
          </div>
        </main>
      </div>
    );
  }

  if (notFound || !recipe) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4">
        <Link href="/" className="contents">
          <Image src="/mums-logo.svg" alt="Mums" width={120} height={30} className="h-8 w-auto dark:hidden" />
          <Image src="/mums-logo-dark.svg" alt="Mums" width={120} height={30} className="hidden h-8 w-auto dark:block" />
        </Link>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Receptet hittades inte eller så har du inte åtkomst.</p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="rounded-2xl border border-zinc-900 bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Gå till startsidan
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur print:hidden dark:border-zinc-800 dark:bg-zinc-950/70">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm shadow-sm transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
          >
            Alla recept
          </button>
          <Link href="/" className="flex items-center gap-3">
            <Image src="/mums-logo.svg" alt="Mums" width={80} height={20} className="h-6 w-auto dark:hidden" />
            <Image src="/mums-logo-dark.svg" alt="Mums" width={80} height={20} className="hidden h-6 w-auto dark:block" />
          </Link>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm shadow-sm transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              title="Skriv ut"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
            </button>
            <button
              type="button"
              onClick={() => router.push(`/edit/${recipe.id}`)}
              className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm shadow-sm transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
              Redigera
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 print:max-w-none print:px-4 print:py-4">
        {(recipe.image_url) && (
          <div className="relative mb-6 aspect-[16/9] overflow-hidden rounded-2xl print:rounded-none">
            <Image src={recipe.image_url} alt={recipe.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 768px" />
          </div>
        )}

        <h1 className="text-3xl font-bold tracking-tight">{recipe.title}</h1>

        {recipe.description && (
          <p className="mt-2 text-zinc-600 dark:text-zinc-300">{recipe.description}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {recipe.category && (
            <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs dark:border-zinc-800 dark:bg-zinc-900">{recipe.category}</span>
          )}
          {recipe.servings && (
            <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs dark:border-zinc-800 dark:bg-zinc-900">{recipe.servings} portioner</span>
          )}
          {recipe.prep_time != null && recipe.prep_time > 0 && (
            <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs dark:border-zinc-800 dark:bg-zinc-900">Förb: {recipe.prep_time} min</span>
          )}
          {recipe.cook_time != null && recipe.cook_time > 0 && (
            <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs dark:border-zinc-800 dark:bg-zinc-900">Tillagning: {recipe.cook_time} min</span>
          )}
          {recipe.source && (
            <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs dark:border-zinc-800 dark:bg-zinc-900">Källa: {recipe.source}</span>
          )}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Ingredienser</h2>
            {ingredients.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">Inga ingredienser tillagda.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {ingredients.map((x) => (
                  <li key={x.id} className="flex items-baseline justify-between gap-4 border-b border-zinc-100 pb-2 text-sm dark:border-zinc-800">
                    <span className="font-medium">{x.ingredient}</span>
                    <span className="text-zinc-500 dark:text-zinc-400">{[x.amount, x.unit].filter(Boolean).join(" ")}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h2 className="text-lg font-semibold tracking-tight">Instruktioner</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-zinc-700 dark:text-zinc-200">
              {recipe.instructions ?? "Inga instruktioner."}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
