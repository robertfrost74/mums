#!/usr/bin/env node
/**
 * Downloads all recipe images from external URLs and uploads them
 * to Supabase Storage, then updates the database with new URLs.
 */

const SUPABASE_URL = "https://znpjchdmshvdzmwjfbfw.supabase.co";
const SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpucGpjaGRtc2h2ZHptd2pmYmZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTgzODkyOCwiZXhwIjoyMDkxNDE0OTI4fQ.5WPMhDRUXebeGYfwGG84L6GIi9GS4CWyEczbuJK4_4I";

const authHeaders = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
};

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[åä]/g, "a")
    .replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  // 1. Fetch all recipes
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/recipes?select=id,title,image_url&order=title`,
    { headers: { ...authHeaders, "Content-Type": "application/json" } },
  );
  const recipes = await res.json();
  console.log(`Hittade ${recipes.length} recept.\n`);

  let ok = 0;
  let fail = 0;
  let skip = 0;

  for (const recipe of recipes) {
    if (!recipe.image_url) {
      console.log(`  ⊘ ${recipe.title} (ingen bild)`);
      skip++;
      continue;
    }

    // Skip if already in Supabase Storage
    if (recipe.image_url.includes("supabase.co/storage")) {
      console.log(`  ⊘ ${recipe.title} (redan i Storage)`);
      skip++;
      continue;
    }

    try {
      // 2. Download the image
      const imgRes = await fetch(recipe.image_url, {
        headers: { "User-Agent": "MumsApp/1.0" },
        redirect: "follow",
      });

      if (!imgRes.ok) {
        throw new Error(`Download failed: ${imgRes.status}`);
      }

      const contentType = imgRes.headers.get("content-type") || "image/jpeg";
      const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
      const imageBuffer = Buffer.from(await imgRes.arrayBuffer());

      const filename = `${slugify(recipe.title)}.${ext}`;
      const storagePath = `recipes/${filename}`;

      // 3. Upload to Supabase Storage
      const uploadRes = await fetch(
        `${SUPABASE_URL}/storage/v1/object/recipe-images/${storagePath}`,
        {
          method: "POST",
          headers: {
            ...authHeaders,
            "Content-Type": contentType,
            "x-upsert": "true",
          },
          body: imageBuffer,
        },
      );

      if (!uploadRes.ok) {
        const errText = await uploadRes.text();
        throw new Error(`Upload failed: ${uploadRes.status} ${errText}`);
      }

      // 4. Build public URL and update recipe
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/recipe-images/${storagePath}`;

      const updateRes = await fetch(
        `${SUPABASE_URL}/rest/v1/recipes?id=eq.${recipe.id}`,
        {
          method: "PATCH",
          headers: {
            ...authHeaders,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({ image_url: publicUrl }),
        },
      );

      if (!updateRes.ok) {
        throw new Error(`DB update failed: ${updateRes.status}`);
      }

      console.log(`  ✓ ${recipe.title} → ${filename} (${(imageBuffer.length / 1024).toFixed(0)} KB)`);
      ok++;
    } catch (e) {
      console.error(`  ✗ ${recipe.title}: ${e.message}`);
      fail++;
    }

    // Small delay to be nice to external servers
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\nKlart! ${ok} migrerade, ${skip} hoppade över, ${fail} misslyckades.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
