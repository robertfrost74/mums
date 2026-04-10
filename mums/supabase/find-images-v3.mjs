#!/usr/bin/env node
/**
 * Fix remaining recipes without images - targeted search with fallbacks.
 */

const SUPABASE_URL = "https://znpjchdmshvdzmwjfbfw.supabase.co";
const SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpucGpjaGRtc2h2ZHptd2pmYmZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTgzODkyOCwiZXhwIjoyMDkxNDE0OTI4fQ.5WPMhDRUXebeGYfwGG84L6GIi9GS4CWyEczbuJK4_4I";

const authHeaders = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

function slugify(str) {
  return str.toLowerCase().replace(/[åä]/g, "a").replace(/ö/g, "o").replace(/é/g, "e").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function searchTheMealDB(query) {
  try {
    const res = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.meals && data.meals.length > 0) return data.meals[0].strMealThumb;
    return null;
  } catch { return null; }
}

async function searchWikimediaFile(query) {
  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query + " filetype:bitmap")}&gsrnamespace=6&gsrlimit=10&prop=imageinfo&iiprop=url|mime|size&iiurlwidth=800&format=json`;
    const res = await fetch(url, { headers: { "User-Agent": "FrostRecipeApp/1.0 (contact@example.com)" } });
    if (!res.ok) return null;
    const data = await res.json();
    const pages = data.query?.pages;
    if (!pages) return null;
    for (const page of Object.values(pages)) {
      const info = page.imageinfo?.[0];
      if (!info) continue;
      const mime = info.mime || "";
      if (!mime.startsWith("image/jpeg") && !mime.startsWith("image/png")) continue;
      if ((info.size || 0) < 10000) continue;
      return info.thumburl || info.url;
    }
    return null;
  } catch { return null; }
}

const targetedSearches = {
  "Basilikagnudi med broccoli": { mealDb: ["Gnocchi", "Ricotta"], wiki: ["gnocchi ricotta basil", "gnudi Italian"] },
  "Blomkålssoppa med vitlöksbaguette": { mealDb: ["Cream of Mushroom Soup"], wiki: ["cream soup garlic bread", "cauliflower cream soup bowl"] },
  "Fläskfilé med pesto": { mealDb: ["Pork Fillet", "Pesto Pasta"], wiki: ["pork tenderloin pesto green", "fläskfilé"] },
  "Gudomliga skorpor": { mealDb: ["Biscotti"], wiki: ["skorpa Swedish rusk", "rusk biscuit"] },
  "Kräftspad": { mealDb: ["Crayfish"], wiki: ["kräftskiva Swedish crayfish", "crayfish party dill"] },
  "Kyckling med getost": { mealDb: ["Stuffed Chicken"], wiki: ["chicken goat cheese baked", "kyckling getost"] },
  "Kycklinggryta med grov senap och dragon": { mealDb: ["Chicken Stew", "Creamy Chicken"], wiki: ["chicken mustard cream stew", "poulet moutarde"] },
  "Löksoppa (Tarte à l'oignon)": { mealDb: ["Onion Tart", "Quiche"], wiki: ["tarte oignon Alsace", "onion tart French"] },
  "Paprikaskal med guacamole": { mealDb: ["Potato Skins", "Guacamole"], wiki: ["potato skins loaded", "guacamole dip"] },
  "Pasta med kalvfrikadeller i tomatsås": { mealDb: ["Spaghetti Bolognese", "Meatball"], wiki: ["meatball pasta tomato sauce Italian", "köttbullar pasta"] },
  "Potatis- och purjolökssoppa": { mealDb: ["Leek Soup", "Potato Soup"], wiki: ["vichyssoise leek potato soup", "potato leek soup bowl"] },
  "Provencalsk kycklinggryta": { mealDb: ["Chicken Provencal", "French Chicken"], wiki: ["poulet provençal chicken", "chicken olives tomato stew"] },
  "Röd chili med skaldjur": { mealDb: ["Seafood Pasta", "Seafood Stew"], wiki: ["spicy seafood noodle soup chili", "seafood chili"] },
  "Smörgåstårta": { mealDb: [], wiki: ["smörgåstårta Swedish", "sandwich cake Swedish", "smörgåstårta"] },
  "Sojamarinerad lax på spett": { mealDb: ["Salmon Teriyaki", "Grilled Salmon"], wiki: ["teriyaki salmon skewer", "lax spett soja"] },
  "Stekt blomkål i skivor": { mealDb: ["Cauliflower", "Roasted"], wiki: ["cauliflower steak roasted", "roasted cauliflower slice"] },
  "Stekt getost på salladsbädd": { mealDb: ["Goat Cheese", "Salad"], wiki: ["fried goat cheese warm salad", "chèvre chaud salade"] },
  "Thailändsk slaw med jordnötter": { mealDb: ["Thai Salad", "Pad Thai"], wiki: ["thai coleslaw peanut lime", "Asian slaw"] },
  "Vitlöks- och pepparkyckling": { mealDb: ["Garlic Chicken", "Thai Chicken", "Pepper Chicken"], wiki: ["garlic pepper chicken Thai basil stir fry", "gai pad krapow"] },
};

async function downloadAndUpload(imageUrl, recipeTitle) {
  try {
    const imgRes = await fetch(imageUrl, {
      headers: { "User-Agent": "FrostRecipeApp/1.0 (contact@example.com)" },
      redirect: "follow",
    });
    if (!imgRes.ok) { console.log(`    HTTP ${imgRes.status}`); return null; }
    const contentType = imgRes.headers.get("content-type") || "image/jpeg";
    if (contentType.includes("svg") || contentType.includes("html")) return null;
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    if (buffer.length < 5000) { console.log(`    Too small: ${buffer.length}b`); return null; }

    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
    const storagePath = `recipes/${slugify(recipeTitle)}-${Date.now()}.${ext}`;

    const uploadRes = await fetch(
      `${SUPABASE_URL}/storage/v1/object/recipe-images/${storagePath}`,
      { method: "POST", headers: { Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": contentType, "x-upsert": "true" }, body: buffer },
    );
    if (!uploadRes.ok) { console.log(`    Upload ${uploadRes.status}`); return null; }
    return `${SUPABASE_URL}/storage/v1/object/public/recipe-images/${storagePath}`;
  } catch (e) { console.log(`    ${e.message}`); return null; }
}

async function updateRecipeImage(id, imageUrl) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/recipes?id=eq.${id}`, {
    method: "PATCH", headers: authHeaders, body: JSON.stringify({ image_url: imageUrl }),
  });
  return res.ok;
}

async function main() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/recipes?select=id,title,image_url&image_url=is.null&order=title`,
    { headers: authHeaders },
  );
  const recipes = await res.json();
  console.log(`${recipes.length} recept saknar bild.\n`);

  let ok = 0, fail = 0;

  for (const recipe of recipes) {
    const searches = targetedSearches[recipe.title] || { mealDb: [recipe.title], wiki: [recipe.title] };
    process.stdout.write(`  ${recipe.title}...`);

    let imageUrl = null;

    for (const term of (searches.mealDb || [])) {
      imageUrl = await searchTheMealDB(term);
      if (imageUrl) { process.stdout.write(` [MealDB: ${term}]`); break; }
    }

    if (!imageUrl) {
      for (const term of (searches.wiki || [])) {
        imageUrl = await searchWikimediaFile(term);
        if (imageUrl) { process.stdout.write(` [Wiki]`); break; }
      }
    }

    if (!imageUrl) {
      console.log(" ✗ Ingen bild");
      fail++;
      continue;
    }

    const storageUrl = await downloadAndUpload(imageUrl, recipe.title);
    if (!storageUrl) {
      console.log(" ✗ Upload failed");
      fail++;
      continue;
    }

    const updated = await updateRecipeImage(recipe.id, storageUrl);
    console.log(updated ? " ✓" : " ✗ DB fail");
    if (updated) ok++;
    else fail++;

    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\nKlart! ${ok} bilder, ${fail} misslyckades.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
