import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const { url } = await request.json();
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "Ingen URL angiven" }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Kunde inte hämta sidan (${res.status})` },
        { status: 422 },
      );
    }

    const html = await res.text();
    const recipe = parseRecipe(html, url);

    return NextResponse.json(recipe);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Kunde inte hämta receptet" },
      { status: 500 },
    );
  }
}

interface ScrapedRecipe {
  title: string;
  description: string;
  instructions: string;
  ingredients: { ingredient: string; amount: string; unit: string }[];
  imageUrl: string | null;
  servings: string;
  prepTime: string;
  cookTime: string;
  category: string;
  source: string;
}

function parseRecipe(html: string, sourceUrl: string): ScrapedRecipe {
  const jsonLd = extractJsonLd(html);
  if (jsonLd) return normalizeJsonLd(jsonLd, sourceUrl);
  return parseFromHtml(html, sourceUrl);
}

function extractJsonLd(html: string): Record<string, unknown> | null {
  const scriptRegex =
    /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      let parsed = JSON.parse(match[1].trim());

      if (Array.isArray(parsed)) {
        parsed = parsed.find(
          (item: Record<string, unknown>) =>
            item["@type"] === "Recipe" ||
            (Array.isArray(item["@type"]) &&
              (item["@type"] as string[]).includes("Recipe")),
        );
      }

      if (parsed?.["@graph"]) {
        const graph = parsed["@graph"] as Record<string, unknown>[];
        parsed = graph.find(
          (item) =>
            item["@type"] === "Recipe" ||
            (Array.isArray(item["@type"]) &&
              (item["@type"] as string[]).includes("Recipe")),
        );
      }

      if (
        parsed &&
        (parsed["@type"] === "Recipe" ||
          (Array.isArray(parsed["@type"]) &&
            (parsed["@type"] as string[]).includes("Recipe")))
      ) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      /* skip invalid JSON */
    }
  }
  return null;
}

function parseDuration(iso: string | undefined | null): string {
  if (!iso || typeof iso !== "string") return "";
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return "";
  const hours = parseInt(match[1] || "0");
  const mins = parseInt(match[2] || "0");
  return String(hours * 60 + mins);
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(p|div|li|ol|ul|h[1-6])[^>]*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeJsonLd(
  ld: Record<string, unknown>,
  sourceUrl: string,
): ScrapedRecipe {
  const rawInstructions = ld.recipeInstructions;
  let instructions = "";

  if (typeof rawInstructions === "string") {
    instructions = stripHtml(rawInstructions);
  } else if (Array.isArray(rawInstructions)) {
    instructions = rawInstructions
      .map((step, i) => {
        if (typeof step === "string") return `${i + 1}. ${stripHtml(step)}`;
        if (step?.text) return `${i + 1}. ${stripHtml(step.text as string)}`;
        if (step?.itemListElement && Array.isArray(step.itemListElement)) {
          return (step.itemListElement as { text: string }[])
            .map(
              (sub: { text: string }, j: number) =>
                `${j + 1}. ${stripHtml(sub.text)}`,
            )
            .join("\n");
        }
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }

  const rawIngredients = (ld.recipeIngredient as string[]) || [];
  const ingredients = rawIngredients.map(parseIngredientString);

  let imageUrl: string | null = null;
  if (typeof ld.image === "string") imageUrl = ld.image;
  else if (Array.isArray(ld.image)) imageUrl = ld.image[0];
  else if (ld.image && typeof ld.image === "object" && "url" in (ld.image as Record<string, unknown>))
    imageUrl = (ld.image as Record<string, string>).url;

  const rawCategory = ld.recipeCategory;
  let category = "";
  if (typeof rawCategory === "string") category = rawCategory;
  else if (Array.isArray(rawCategory)) category = rawCategory[0] || "";

  let hostname = "";
  try {
    hostname = new URL(sourceUrl).hostname.replace(/^www\./, "");
  } catch { /* ignore */ }

  return {
    title: String(ld.name || ""),
    description: String(ld.description || ""),
    instructions,
    ingredients,
    imageUrl,
    servings: ld.recipeYield
      ? String(
          Array.isArray(ld.recipeYield)
            ? ld.recipeYield[0]
            : ld.recipeYield,
        ).replace(/[^\d]/g, "")
      : "",
    prepTime: parseDuration(ld.prepTime as string),
    cookTime: parseDuration(ld.cookTime as string),
    category,
    source: hostname,
  };
}

function parseIngredientString(raw: string): {
  ingredient: string;
  amount: string;
  unit: string;
} {
  const cleaned = stripHtml(raw).trim();
  const units =
    /^([\d\s/.,½¼¾⅓⅔⅛]+)\s*(msk|tsk|dl|cl|ml|l|liter|kg|hg|g|st|krm|port|paket|pkt|burk|förp|knippe|kruka|nypa|skivor?|klyftor?)\b\s*/i;
  const match = cleaned.match(units);
  if (match) {
    return {
      amount: match[1].trim(),
      unit: match[2].trim(),
      ingredient: cleaned.slice(match[0].length).trim(),
    };
  }

  const simpleAmount = /^([\d\s/.,½¼¾⅓⅔⅛]+)\s+/;
  const simpleMatch = cleaned.match(simpleAmount);
  if (simpleMatch) {
    return {
      amount: simpleMatch[1].trim(),
      unit: "",
      ingredient: cleaned.slice(simpleMatch[0].length).trim(),
    };
  }

  return { ingredient: cleaned, amount: "", unit: "" };
}

function parseFromHtml(html: string, sourceUrl: string): ScrapedRecipe {
  const titleMatch =
    html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) ||
    html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? stripHtml(titleMatch[1]) : "";

  const descMatch = html.match(
    /<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["']/i,
  );
  const description = descMatch ? stripHtml(descMatch[1]) : "";

  let imageUrl: string | null = null;
  const ogImage = html.match(
    /<meta[^>]*property=["']og:image["'][^>]*content=["']([\s\S]*?)["']/i,
  );
  if (ogImage) imageUrl = ogImage[1];

  let hostname = "";
  try {
    hostname = new URL(sourceUrl).hostname.replace(/^www\./, "");
  } catch { /* ignore */ }

  return {
    title,
    description,
    instructions: "",
    ingredients: [],
    imageUrl,
    servings: "",
    prepTime: "",
    cookTime: "",
    category: "",
    source: hostname,
  };
}
