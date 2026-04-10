"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { RecipeWithIngredients } from "@/lib/types";

type IngredientRow = { ingredient: string; amount: string; unit: string };

const EMPTY_ROW: IngredientRow = { ingredient: "", amount: "", unit: "" };

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[åä]/g, "a")
    .replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function EditRecipePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loadingRecipe, setLoadingRecipe] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [category, setCategory] = useState("");
  const [source, setSource] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [remoteImageUrl, setRemoteImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [servings, setServings] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [ingredients, setIngredients] = useState<IngredientRow[]>([
    { ...EMPTY_ROW },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [findingImage, setFindingImage] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoadingRecipe(true);

    supabase
      .from("recipes")
      .select("*, recipe_ingredients(*)")
      .eq("id", id)
      .single()
      .then(({ data, error: fetchErr }) => {
        if (fetchErr || !data) {
          setError("Receptet hittades inte");
          setLoadingRecipe(false);
          return;
        }
        const r = data as unknown as RecipeWithIngredients;
        setTitle(r.title);
        setDescription(r.description ?? "");
        setInstructions(r.instructions ?? "");
        setCategory(r.category ?? "");
        setSource(r.source ?? "");
        setServings(r.servings != null ? String(r.servings) : "");
        setPrepTime(r.prep_time != null ? String(r.prep_time) : "");
        setCookTime(r.cook_time != null ? String(r.cook_time) : "");
        setExistingImageUrl(r.image_url);
        setImagePreview(r.image_url);

        const sorted = [...(r.recipe_ingredients ?? [])].sort(
          (a, b) => a.sort_order - b.sort_order,
        );
        if (sorted.length > 0) {
          setIngredients(
            sorted.map((ing) => ({
              ingredient: ing.ingredient,
              amount: ing.amount ?? "",
              unit: ing.unit ?? "",
            })),
          );
        }
        setLoadingRecipe(false);
      });
  }, [id, supabase]);

  const handleImageSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setImageFile(file);
      setRemoteImageUrl(null);
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    },
    [],
  );

  const removeImage = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
    setRemoteImageUrl(null);
    setExistingImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleFindImage = useCallback(async () => {
    if (!title.trim()) return;
    setFindingImage(true);
    try {
      const res = await fetch("/api/find-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), recipeId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRemoteImageUrl(data.url);
      setImagePreview(data.url);
      setExistingImageUrl(data.url);
      setImageFile(null);
    } catch {
      /* silently ignore */
    } finally {
      setFindingImage(false);
    }
  }, [title, id]);

  const uploadImage = useCallback(
    async (recipeTitle: string): Promise<string | null> => {
      if (!imageFile && !remoteImageUrl) return existingImageUrl;
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("filename", slugify(recipeTitle));

        if (imageFile) {
          formData.append("file", imageFile);
        } else if (remoteImageUrl) {
          formData.append("remoteUrl", remoteImageUrl);
        }

        const res = await fetch("/api/upload-image", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.error || "Uppladdning misslyckades");
        return data.url;
      } finally {
        setUploading(false);
      }
    },
    [imageFile, remoteImageUrl, existingImageUrl],
  );

  const updateIngredient = (
    idx: number,
    field: keyof IngredientRow,
    value: string,
  ) => {
    setIngredients((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row)),
    );
  };

  const addRow = () => setIngredients((prev) => [...prev, { ...EMPTY_ROW }]);

  const removeRow = (idx: number) => {
    setIngredients((prev) =>
      prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    setError(null);

    try {
      const uploadedUrl = await uploadImage(title.trim());

      const { error: recipeErr } = await supabase
        .from("recipes")
        .update({
          title: title.trim(),
          description: description.trim() || null,
          instructions: instructions.trim() || null,
          category: category.trim() || null,
          source: source.trim() || null,
          image_url: uploadedUrl,
          servings: servings ? parseInt(servings) : null,
          prep_time: prepTime ? parseInt(prepTime) : null,
          cook_time: cookTime ? parseInt(cookTime) : null,
        })
        .eq("id", id);

      if (recipeErr) throw recipeErr;

      await supabase.from("recipe_ingredients").delete().eq("recipe_id", id);

      const validIngredients = ingredients.filter((r) => r.ingredient.trim());
      if (validIngredients.length > 0) {
        const { error: ingErr } = await supabase
          .from("recipe_ingredients")
          .insert(
            validIngredients.map((r, i) => ({
              recipe_id: id,
              ingredient: r.ingredient.trim(),
              amount: r.amount.trim() || null,
              unit: r.unit.trim() || null,
              sort_order: i,
            })),
          );
        if (ingErr) throw ingErr;
      }

      router.push("/");
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Kunde inte uppdatera receptet",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await supabase.from("recipe_ingredients").delete().eq("recipe_id", id);
      const { error: delErr } = await supabase
        .from("recipes")
        .delete()
        .eq("id", id);
      if (delErr) throw delErr;

      router.push("/");
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Kunde inte ta bort receptet",
      );
      setDeleting(false);
    }
  };

  const inputCls =
    "w-full rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600";
  const labelCls = "mb-1.5 block text-sm font-medium";

  if (loadingRecipe) {
    return (
      <div className="min-h-dvh">
        <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70">
          <div className="mx-auto flex max-w-3xl items-center justify-center px-4 py-3">
            <Image
              src="/mums-logo.svg"
              alt="Mums"
              width={80}
              height={20}
              className="h-6 w-auto dark:hidden"
            />
            <Image
              src="/mums-logo-dark.svg"
              alt="Mums"
              width={80}
              height={20}
              className="hidden h-6 w-auto dark:block"
            />
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-8">
          <div className="space-y-4">
            <div className="h-8 w-1/3 animate-pulse rounded-xl bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-12 w-full animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-24 w-full animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
            <div className="h-48 w-full animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm shadow-sm transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
          >
            Tillbaka
          </button>

          <div className="flex items-center gap-3">
            <Image
              src="/mums-logo.svg"
              alt="Mums"
              width={80}
              height={20}
              className="h-6 w-auto dark:hidden"
            />
            <Image
              src="/mums-logo-dark.svg"
              alt="Mums"
              width={80}
              height={20}
              className="hidden h-6 w-auto dark:block"
            />
          </div>

          <div className="w-[80px]" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-8 text-2xl font-semibold tracking-tight">
          Redigera recept
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className={labelCls}>
              Titel *
            </label>
            <input
              id="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="T.ex. Mormors köttbullar"
              className={inputCls}
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="desc" className={labelCls}>
              Beskrivning
            </label>
            <textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kort beskrivning av rätten…"
              rows={2}
              className={inputCls + " resize-y"}
            />
          </div>

          {/* Category + Source */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="category" className={labelCls}>
                Kategori
              </label>
              <input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="T.ex. Husmanskost"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="source" className={labelCls}>
                Källa
              </label>
              <input
                id="source"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="T.ex. Mormors kokbok"
                className={inputCls}
              />
            </div>
          </div>

          {/* Servings + times */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="servings" className={labelCls}>
                Portioner
              </label>
              <input
                id="servings"
                type="number"
                min="1"
                value={servings}
                onChange={(e) => setServings(e.target.value)}
                placeholder="4"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="prep" className={labelCls}>
                Förberedningstid (min)
              </label>
              <input
                id="prep"
                type="number"
                min="0"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                placeholder="15"
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="cook" className={labelCls}>
                Tillagningstid (min)
              </label>
              <input
                id="cook"
                type="number"
                min="0"
                value={cookTime}
                onChange={(e) => setCookTime(e.target.value)}
                placeholder="30"
                className={inputCls}
              />
            </div>
          </div>

          {/* Image */}
          <div>
            <span className={labelCls}>Bild</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              onChange={handleImageSelect}
              className="hidden"
              id="image-upload"
            />

            {imagePreview ? (
              <div className="relative">
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
                  <Image
                    src={imagePreview}
                    alt="Förhandsgranskning"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="absolute right-2 top-2 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-full bg-black/60 p-1.5 text-white transition hover:bg-black/80"
                    aria-label="Byt bild"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" x2="12" y1="3" y2="15" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="rounded-full bg-black/60 p-1.5 text-white transition hover:bg-black/80"
                    aria-label="Ta bort bild"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={[
                    "flex flex-1 items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-sm transition-colors",
                    "hover:border-zinc-400 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600 dark:hover:bg-zinc-800",
                  ].join(" ")}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-zinc-400"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                  </svg>
                  <span className="text-zinc-500 dark:text-zinc-400">
                    Ta en bild eller välj fil
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleFindImage}
                  disabled={findingImage || !title.trim()}
                  className={[
                    "flex flex-none items-center justify-center gap-2 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-sm transition-colors",
                    "hover:border-zinc-400 hover:bg-zinc-100 disabled:pointer-events-none disabled:opacity-40 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600 dark:hover:bg-zinc-800",
                  ].join(" ")}
                >
                  {findingImage ? (
                    <svg
                      className="h-5 w-5 animate-spin text-zinc-400"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  ) : (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-zinc-400"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.35-4.35" />
                    </svg>
                  )}
                  <span className="text-zinc-500 dark:text-zinc-400">
                    {findingImage ? "Söker…" : "Hitta bild"}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Ingredients */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className={labelCls}>Ingredienser</span>
              <button
                type="button"
                onClick={addRow}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs shadow-sm transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
              >
                + Lägg till rad
              </button>
            </div>

            <div className="space-y-2">
              {ingredients.map((row, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={row.ingredient}
                    onChange={(e) =>
                      updateIngredient(i, "ingredient", e.target.value)
                    }
                    placeholder="Ingrediens"
                    className={inputCls + " flex-[3]"}
                  />
                  <input
                    value={row.amount}
                    onChange={(e) =>
                      updateIngredient(i, "amount", e.target.value)
                    }
                    placeholder="Mängd"
                    className={inputCls + " flex-1"}
                  />
                  <input
                    value={row.unit}
                    onChange={(e) =>
                      updateIngredient(i, "unit", e.target.value)
                    }
                    placeholder="Enhet"
                    className={inputCls + " flex-1"}
                  />
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    className="flex-none rounded-xl p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                    aria-label="Ta bort rad"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div>
            <label htmlFor="instructions" className={labelCls}>
              Instruktioner
            </label>
            <textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Steg-för-steg instruktioner…"
              rows={8}
              className={inputCls + " resize-y"}
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-100">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || uploading || !title.trim()}
              className="rounded-2xl border border-zinc-900 bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {uploading
                ? "Laddar upp bild…"
                : saving
                  ? "Sparar…"
                  : "Spara ändringar"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-2xl border border-zinc-200 bg-white px-6 py-3 text-sm shadow-sm transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
              Avbryt
            </button>

            <div className="flex-1" />

            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm text-red-600 shadow-sm transition-colors hover:bg-red-50 dark:border-red-900/40 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-950/30"
              >
                Ta bort
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-600 dark:text-red-400">
                  Säker?
                </span>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-2xl border border-red-600 bg-red-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50 dark:border-red-500 dark:bg-red-500"
                >
                  {deleting ? "Tar bort…" : "Ja, ta bort"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm shadow-sm transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                >
                  Nej
                </button>
              </div>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}
