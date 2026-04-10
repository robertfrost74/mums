#!/usr/bin/env node
/**
 * Find and upload images for recipes that don't have one yet.
 * Uses TheMealDB and Unsplash as image sources.
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
  return str
    .toLowerCase()
    .replace(/[åä]/g, "a")
    .replace(/ö/g, "o")
    .replace(/é/g, "e")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const searchTermMap = {
  "Alex's club Sandwich": "club sandwich",
  "Allt i allo gryta": "beef stew vegetables",
  "Basilikagnudi med broccoli": "gnudi basil broccoli",
  "Biffwok i soja": "beef stir fry soy sauce",
  "Broccoli och kasslergratäng": "broccoli gratin",
  "Broccolitimbal": "broccoli timbale",
  "Coq au vin kycklinggryta": "coq au vin",
  "Couscoussallad med rostade grönsaker och het sås": "couscous roasted vegetables",
  "Den bästa vegetariska lasagnen": "vegetarian lasagna",
  "Fish tacos": "fish tacos salmon",
  "Fläskfilé med pesto": "pork tenderloin pesto",
  "Förälskade havskräftor": "langoustine flambé",
  "Gratinerad hummer": "lobster gratin",
  "Gratinerade sniglar": "escargot garlic butter",
  "Hoisinkyckling": "hoisin chicken",
  "Japansk fondue": "japanese hot pot shabu",
  "Kong Pao Kyckling": "kung pao chicken",
  "Kyckling med getost": "chicken goat cheese",
  "Kycklingkebab": "chicken kebab pita",
  "Krämiga nudlar med röd curry och krispig fräs": "red curry noodles coconut",
  "Kycklinggryta med grov senap och dragon": "chicken mustard tarragon stew",
  "Lamm med pistage och harissa-morötter": "lamb pistachio crust harissa carrots",
  "Langos med tomater, mozzarella och pesto": "langos hungarian bread",
  "Lasagne med köttfärs": "meat lasagna",
  "Lax på rotfruktsbädd": "salmon root vegetables",
  "Pad thai": "pad thai noodles",
  "Paprikaskal med guacamole": "potato skins guacamole",
  "Pasta med kalvfrikadeller i tomatsås": "meatballs pasta tomato sauce",
  "Pasta med kronärtskocka och citron": "pasta artichoke lemon",
  "Pasta med rostad blomkål": "pasta roasted cauliflower parmesan",
  "Potatiskroketter": "potato croquettes fried",
  "Potatis och fänkålsgratäng": "potato fennel gratin",
  "Provencalsk kycklinggryta": "provencal chicken stew olives",
  "Ratatouillegryta med vitlöksbakad sej": "ratatouille fish",
  "Rispappersrullar med cashewdipp": "rice paper rolls fresh",
  "Röd chili med skaldjur": "spicy seafood noodle soup",
  "Sesampanerad tonfisk": "sesame crusted tuna",
  "Sesampanerad tonfisk med chilimajonnäs": "seared tuna sesame salad",
  "Smörgåstårta": "smörgåstårta swedish sandwich cake",
  "Sojamarinerad lax på spett": "soy marinated salmon skewers",
  "Souvlakia": "chicken souvlaki pita",
  "Stekt blomkål i skivor": "roasted cauliflower steak",
  "Stekt getost på salladsbädd": "fried goat cheese salad",
  "Thailändsk slaw med jordnötter": "thai coleslaw peanuts",
  "Torsk med oliver och kronärtskocka": "cod olives artichoke",
  "Ugnsbakad kall lax": "cold baked salmon dill",
  "Ugnslagad lax": "oven baked salmon cream",
  "Vitlöks- och pepparkyckling": "garlic pepper chicken thai basil",
  "Världens godaste plättar": "swedish pancakes plättar",
  "Blomkålssoppa med bacon och ruccolaolja": "cauliflower soup bacon",
  "Blomkålssoppa med vitlöksbaguette": "cauliflower soup garlic bread",
  "Fänkål- och morotssoppa med apelsin": "fennel carrot orange soup",
  "Gulaschsoppa från Österrike": "goulash soup austrian",
  "Gräddig räksoppa": "creamy shrimp soup",
  "Hummersoppa": "lobster bisque soup",
  "Klassisk löksoppa": "french onion soup classic",
  "Kycklingsoppa": "chicken noodle soup asian",
  "Löksoppa (Tarte à l'oignon)": "french onion tart tarte oignon",
  "Nongs super syrliga räksoppa": "tom yum goong spicy shrimp soup",
  "Potatis- och purjolökssoppa": "potato leek soup",
  "Tom Kha Goong": "tom kha gai coconut soup",
  "Ananaspaj": "pineapple pie",
  "Ett stort bröd": "artisan round bread sesame",
  "Gudomliga skorpor": "swedish rusk skorpa",
  "Korvbröd": "hot dog buns homemade",
  "Leilas chocolate cupcakes": "chocolate cupcakes frosting",
  "Mormors saftiga äppelkaka": "swedish apple cake",
  "Pâté Brisée - fransk äppelkaka": "french apple tart tarte aux pommes",
  "Kräftspad": "crayfish boil dill",
};

async function searchUnsplash(query) {
  const url = `https://unsplash.com/napi/search/photos?query=${encodeURIComponent(query + " food")}&per_page=5`;
  try {
    const res = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0",
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const results = data.results || [];
    for (const photo of results) {
      const desc = (photo.description || photo.alt_description || "").toLowerCase();
      if (
        desc.includes("person") ||
        desc.includes("portrait") ||
        desc.includes("woman") ||
        desc.includes("man") ||
        desc.includes("people")
      ) {
        continue;
      }
      return photo.urls?.regular || photo.urls?.small;
    }
    if (results.length > 0) {
      return results[0].urls?.regular || results[0].urls?.small;
    }
    return null;
  } catch {
    return null;
  }
}

async function searchTheMealDB(query) {
  try {
    const url = `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.meals && data.meals.length > 0) {
      return data.meals[0].strMealThumb;
    }
    return null;
  } catch {
    return null;
  }
}

const mealDbSearches = {
  "Coq au vin kycklinggryta": "Coq au vin",
  "Kong Pao Kyckling": "Kung Pao Chicken",
  "Pad thai": "Pad Thai",
  "Fish tacos": "Fish tacos",
  "Hoisinkyckling": "Teriyaki Chicken",
  "Sesampanerad tonfisk": "Sushi",
  "Tom Kha Goong": "Thai Green Curry",
};

async function downloadAndUpload(imageUrl, recipeTitle) {
  try {
    const imgRes = await fetch(imageUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      redirect: "follow",
    });
    if (!imgRes.ok) return null;

    const contentType = imgRes.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    if (buffer.length < 5000) return null;

    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
    const filename = `${slugify(recipeTitle)}-${Date.now()}.${ext}`;
    const storagePath = `recipes/${filename}`;

    const uploadRes = await fetch(
      `${SUPABASE_URL}/storage/v1/object/recipe-images/${storagePath}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SERVICE_KEY}`,
          "Content-Type": contentType,
          "x-upsert": "true",
        },
        body: buffer,
      },
    );

    if (!uploadRes.ok) {
      console.error(`    Upload failed: ${uploadRes.status}`);
      return null;
    }

    return `${SUPABASE_URL}/storage/v1/object/public/recipe-images/${storagePath}`;
  } catch (e) {
    console.error(`    Download/upload error: ${e.message}`);
    return null;
  }
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

  let ok = 0;
  let fail = 0;

  for (const recipe of recipes) {
    const searchTerm = searchTermMap[recipe.title] || recipe.title;
    process.stdout.write(`  ${recipe.title}...`);

    let imageUrl = null;

    const mealDbTerm = mealDbSearches[recipe.title];
    if (mealDbTerm) {
      imageUrl = await searchTheMealDB(mealDbTerm);
      if (imageUrl) process.stdout.write(" [MealDB]");
    }

    if (!imageUrl) {
      imageUrl = await searchUnsplash(searchTerm);
      if (imageUrl) process.stdout.write(" [Unsplash]");
    }

    if (!imageUrl) {
      imageUrl = await searchUnsplash(recipe.title);
      if (imageUrl) process.stdout.write(" [Unsplash fallback]");
    }

    if (!imageUrl) {
      console.log(" ✗ Ingen bild hittad");
      fail++;
      continue;
    }

    const storageUrl = await downloadAndUpload(imageUrl, recipe.title);
    if (!storageUrl) {
      console.log(" ✗ Kunde inte ladda upp");
      fail++;
      continue;
    }

    const updated = await updateRecipeImage(recipe.id, storageUrl);
    if (updated) {
      console.log(" ✓");
      ok++;
    } else {
      console.log(" ✗ DB update failed");
      fail++;
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  console.log(`\nKlart! ${ok} bilder hittade, ${fail} misslyckades.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
