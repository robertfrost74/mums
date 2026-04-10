#!/usr/bin/env node
/**
 * Find and upload images from recept.se for recipes without images.
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

const searchTerms = {
  "Basilikagnudi med broccoli": "gnudi broccoli",
  "Blomkålssoppa med vitlöksbaguette": "blomkålssoppa",
  "Fläskfilé med pesto": "fläskfilé pesto",
  "Gudomliga skorpor": "skorpor",
  "Kräftspad": "kräftor dill",
  "Kyckling med getost": "kyckling getost",
  "Kycklinggryta med grov senap och dragon": "kycklinggryta senap dragon",
  "Löksoppa (Tarte à l'oignon)": "lökpaj",
  "Paprikaskal med guacamole": "guacamole",
  "Pasta med kalvfrikadeller i tomatsås": "köttbullar pasta tomatsås",
  "Potatis- och purjolökssoppa": "potatis purjolökssoppa",
  "Provencalsk kycklinggryta": "kycklinggryta tomat vin",
  "Röd chili med skaldjur": "skaldjur chili nudlar",
  "Smörgåstårta": "smörgåstårta",
  "Sojamarinerad lax på spett": "lax spett soja",
  "Stekt blomkål i skivor": "stekt blomkål",
  "Stekt getost på salladsbädd": "stekt getost sallad",
  "Thailändsk slaw med jordnötter": "thailändsk slaw jordnötter",
  "Vitlöks- och pepparkyckling": "vitlök peppar kyckling wok",
};

async function searchReceptSe(query) {
  try {
    const res = await fetch(`https://recept.se/sok?q=${encodeURIComponent(query)}`, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const matches = html.match(/https:\/\/images\.recept\.se\/images\/recipes\/[^\s"']+\.(jpg|jpeg|png|webp)/gi) || [];
    const unique = [...new Set(matches)].filter(u => !u.includes("placeholder"));
    return unique[0] || null;
  } catch { return null; }
}

async function downloadAndUpload(imageUrl, recipeTitle) {
  try {
    const imgRes = await fetch(imageUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" },
      redirect: "follow",
    });
    if (!imgRes.ok) return null;
    const contentType = imgRes.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    if (buffer.length < 5000) return null;

    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
    const storagePath = `recipes/${slugify(recipeTitle)}-${Date.now()}.${ext}`;

    const uploadRes = await fetch(
      `${SUPABASE_URL}/storage/v1/object/recipe-images/${storagePath}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": contentType, "x-upsert": "true" },
        body: buffer,
      },
    );
    if (!uploadRes.ok) return null;
    return `${SUPABASE_URL}/storage/v1/object/public/recipe-images/${storagePath}`;
  } catch { return null; }
}

async function updateRecipeImage(id, imageUrl) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/recipes?id=eq.${id}`, {
    method: "PATCH",
    headers: authHeaders,
    body: JSON.stringify({ image_url: imageUrl }),
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
    const query = searchTerms[recipe.title] || recipe.title;
    process.stdout.write(`  ${recipe.title} [sök: ${query}]...`);

    let imageUrl = await searchReceptSe(query);

    if (!imageUrl && query !== recipe.title) {
      imageUrl = await searchReceptSe(recipe.title);
    }

    if (!imageUrl) {
      const simpler = recipe.title.split(" ").slice(0, 2).join(" ");
      imageUrl = await searchReceptSe(simpler);
    }

    if (!imageUrl) {
      console.log(" ✗ Ingen bild");
      fail++;
      continue;
    }

    process.stdout.write(` -> ${imageUrl.split("/").pop()}...`);

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

    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\nKlart! ${ok} bilder, ${fail} misslyckades.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
