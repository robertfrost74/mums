"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

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

export default function AddRecipePage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [category, setCategory] = useState("");
  const [source, setSource] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [remoteImageUrl, setRemoteImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [servings, setServings] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [ingredients, setIngredients] = useState<IngredientRow[]>([
    { ...EMPTY_ROW },
  ]);
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [findingImage, setFindingImage] = useState(false);

  const handleImportUrl = useCallback(async () => {
    const url = importUrl.trim();
    if (!url) return;
    setImporting(true);
    setImportError(null);
    try {
      const res = await fetch("/api/scrape-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Kunde inte hämta receptet");

      if (data.title) setTitle(data.title);
      if (data.description) setDescription(data.description);
      if (data.instructions) setInstructions(data.instructions);
      if (data.category) setCategory(data.category);
      if (data.source) setSource(data.source);
      if (data.servings) setServings(data.servings);
      if (data.prepTime) setPrepTime(data.prepTime);
      if (data.cookTime) setCookTime(data.cookTime);
      if (data.ingredients?.length > 0) {
        setIngredients(data.ingredients);
      }
      if (data.imageUrl) {
        setRemoteImageUrl(data.imageUrl);
        setImagePreview(data.imageUrl);
        setImageFile(null);
      }
    } catch (e) {
      setImportError(e instanceof Error ? e.message : "Kunde inte hämta receptet");
    } finally {
      setImporting(false);
    }
  }, [importUrl]);

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setRemoteImageUrl(null);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const removeImage = useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
    setRemoteImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleFindImage = useCallback(async () => {
    if (!title.trim()) return;
    setFindingImage(true);
    try {
      const res = await fetch("/api/find-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRemoteImageUrl(data.url);
      setImagePreview(data.url);
      setImageFile(null);
    } catch {
      /* no image found - silently ignore */
    } finally {
      setFindingImage(false);
    }
  }, [title]);

  const uploadImage = useCallback(
    async (recipeTitle: string): Promise<string | null> => {
      if (!imageFile && !remoteImageUrl) return null;
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("filename", slugify(recipeTitle));

        if (imageFile) {
          formData.append("file", imageFile);
        } else if (remoteImageUrl) {
          formData.append("remoteUrl", remoteImageUrl);
        }

        const res = await fetch("/api/upload-image", { method: "POST", body: formData });
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Uppladdning misslyckades");
        return data.url;
      } finally {
        setUploading(false);
      }
    },
    [imageFile, remoteImageUrl],
  );

  useEffect(() => {
    supabase.rpc("get_my_family_id").then(({ data }) => {
      if (data) setFamilyId(data);
    });
  }, [supabase]);

  const updateIngredient = (idx: number, field: keyof IngredientRow, value: string) => {
    setIngredients((prev) => {
      const updated = prev.map((row, i) => (i === idx ? { ...row, [field]: value } : row));
      if (field === "ingredient" && value && idx === prev.length - 1) {
        updated.push({ ...EMPTY_ROW });
      }
      return updated;
    });
  };

  const addRow = () => setIngredients((prev) => [...prev, { ...EMPTY_ROW }]);

  const removeRow = (idx: number) => {
    setIngredients((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyId || !title.trim()) return;

    setSaving(true);
    setError(null);

    try {
      const { data: user } = await supabase.auth.getUser();
      const uploadedUrl = await uploadImage(title.trim());

      const { data: recipe, error: recipeErr } = await supabase
        .from("recipes")
        .insert({
          family_id: familyId,
          title: title.trim(),
          description: description.trim() || null,
          instructions: instructions.trim() || null,
          category: category.trim() || null,
          source: source.trim() || null,
          image_url: uploadedUrl,
          servings: servings ? parseInt(servings) : null,
          prep_time: prepTime ? parseInt(prepTime) : null,
          cook_time: cookTime ? parseInt(cookTime) : null,
          created_by: user.user?.id ?? null,
        })
        .select()
        .single();

      if (recipeErr) throw recipeErr;

      const validIngredients = ingredients.filter((r) => r.ingredient.trim());
      if (validIngredients.length > 0 && recipe) {
        const { error: ingErr } = await supabase.from("recipe_ingredients").insert(
          validIngredients.map((r, i) => ({
            recipe_id: recipe.id,
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
      setError(e instanceof Error ? e.message : "Kunde inte spara receptet");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:focus:border-zinc-600";
  const labelCls = "mb-1.5 block text-sm font-medium";

  return (
    <div className="min-h-dvh">
      {/* Top bar */}
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
        <h1 className="mb-8 text-2xl font-semibold tracking-tight">Nytt recept</h1>

        {/* Import from URL */}
        <div className="mb-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
          <span className={labelCls}>Importera från URL</span>
          <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
            Klistra in en länk till ett recept så fylls formuläret i automatiskt.
          </p>
          <div className="flex gap-2">
            <input
              type="url"
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleImportUrl(); } }}
              placeholder="https://recept.se/recept/..."
              className={inputCls + " flex-1"}
            />
            <button
              type="button"
              onClick={handleImportUrl}
              disabled={importing || !importUrl.trim()}
              className="flex-none rounded-2xl border border-zinc-900 bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {importing ? (
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Hämtar…
                </span>
              ) : (
                "Hämta"
              )}
            </button>
          </div>
          {importError && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">{importError}</p>
          )}
        </div>

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

          {/* Image upload */}
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
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white transition hover:bg-black/80"
                  aria-label="Ta bort bild"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
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
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                  <span className="text-zinc-500 dark:text-zinc-400">Ta en bild eller välj fil</span>
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
                    <svg className="h-5 w-5 animate-spin text-zinc-400" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                  )}
                  <span className="text-zinc-500 dark:text-zinc-400">{findingImage ? "Söker…" : "Hitta bild"}</span>
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
                    onChange={(e) => updateIngredient(i, "ingredient", e.target.value)}
                    placeholder="Ingrediens"
                    className={inputCls + " flex-[3]"}
                  />
                  <input
                    value={row.amount}
                    onChange={(e) => updateIngredient(i, "amount", e.target.value)}
                    placeholder="Mängd"
                    className={inputCls + " flex-1"}
                  />
                  <input
                    value={row.unit}
                    onChange={(e) => updateIngredient(i, "unit", e.target.value)}
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

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || uploading || !title.trim()}
              className="rounded-2xl border border-zinc-900 bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {uploading ? "Laddar upp bild…" : saving ? "Sparar…" : "Spara recept"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-2xl border border-zinc-200 bg-white px-6 py-3 text-sm shadow-sm transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
              Avbryt
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
