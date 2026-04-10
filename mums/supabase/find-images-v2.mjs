#!/usr/bin/env node
/**
 * Find and upload images for recipes that don't have one yet.
 * Uses TheMealDB with broad English search terms, then Wikimedia Commons API.
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

async function searchWikimedia(query) {
  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url|mime&iiurlwidth=800&format=json`;
    const res = await fetch(url, { headers: { "User-Agent": "FrostRecipeApp/1.0" } });
    if (!res.ok) return null;
    const data = await res.json();
    const pages = data.query?.pages;
    if (!pages) return null;
    for (const page of Object.values(pages)) {
      const info = page.imageinfo?.[0];
      if (!info) continue;
      const mime = info.mime || "";
      if (!mime.startsWith("image/")) continue;
      if (mime.includes("svg")) continue;
      const thumbUrl = info.thumburl;
      if (thumbUrl) return thumbUrl;
    }
    return null;
  } catch { return null; }
}

const mealDbMap = {
  "Alex's club Sandwich": ["Club Sandwich", "Chicken Sandwich"],
  "Allt i allo gryta": ["Beef Stew", "Irish Stew"],
  "Ananaspaj": ["Pineapple Upside Down Cake"],
  "Basilikagnudi med broccoli": ["Gnocchi"],
  "Biffwok i soja": ["Beef Lo Mein", "Beef stir fry"],
  "Blomkålssoppa med bacon och ruccolaolja": ["Cauliflower Soup"],
  "Blomkålssoppa med vitlöksbaguette": ["Cauliflower Soup"],
  "Broccoli och kasslergratäng": ["Broccoli"],
  "Broccolitimbal": ["Broccoli"],
  "Couscoussallad med rostade grönsaker och het sås": ["Couscous", "Mediterranean"],
  "Den bästa vegetariska lasagnen": ["Vegetarian Lasagne", "Lasagne"],
  "Ett stort bröd": ["Bread"],
  "Fänkål- och morotssoppa med apelsin": ["Carrot Soup", "Soup"],
  "Fläskfilé med pesto": ["Pork Fillet"],
  "Förälskade havskräftor": ["Crab Langoustine", "Seafood"],
  "Gräddig räksoppa": ["Shrimp Soup", "Bisque"],
  "Gratinerad hummer": ["Lobster", "Gratin"],
  "Gratinerade sniglar": ["Escargot"],
  "Gudomliga skorpor": ["Biscotti", "Rusk"],
  "Gulaschsoppa från Österrike": ["Goulash"],
  "Hummersoppa": ["Lobster Soup", "Bisque"],
  "Japansk fondue": ["Shabu Shabu", "Hot Pot"],
  "Klassisk löksoppa": ["French Onion Soup"],
  "Korvbröd": ["Hot Dog", "Bread Rolls"],
  "Kräftspad": ["Crayfish"],
  "Krämiga nudlar med röd curry och krispig fräs": ["Red Curry", "Curry Noodle"],
  "Kyckling med getost": ["Chicken Goat Cheese"],
  "Kycklinggryta med grov senap och dragon": ["Chicken Mustard", "Chicken Stew"],
  "Kycklingkebab": ["Chicken Kebab", "Kebab"],
  "Kycklingsoppa": ["Chicken Noodle Soup", "Chicken Soup"],
  "Lamm med pistage och harissa-morötter": ["Lamb", "Harissa"],
  "Langos med tomater, mozzarella och pesto": ["Langos"],
  "Lasagne med köttfärs": ["Lasagne"],
  "Lax på rotfruktsbädd": ["Salmon", "Baked Salmon"],
  "Leilas chocolate cupcakes": ["Chocolate Cupcake", "Cupcake"],
  "Löksoppa (Tarte à l'oignon)": ["Tarte Oignon", "Onion Tart"],
  "Mormors saftiga äppelkaka": ["Apple Cake"],
  "Nongs super syrliga räksoppa": ["Tom Yum", "Tom Yum Goong"],
  "Paprikaskal med guacamole": ["Potato Skins", "Guacamole"],
  "Pasta med kalvfrikadeller i tomatsås": ["Meatball Pasta", "Spaghetti Meatballs"],
  "Pasta med kronärtskocka och citron": ["Artichoke Pasta", "Pasta"],
  "Pasta med rostad blomkål": ["Cauliflower Pasta", "Roasted Cauliflower"],
  "Pâté Brisée - fransk äppelkaka": ["Apple Tart", "Tarte Tatin"],
  "Potatis och fänkålsgratäng": ["Potato Gratin", "Fennel"],
  "Potatis- och purjolökssoppa": ["Leek Potato Soup", "Leek Soup"],
  "Potatiskroketter": ["Croquette", "Potato"],
  "Provencalsk kycklinggryta": ["Chicken Provencal"],
  "Ratatouillegryta med vitlöksbakad sej": ["Ratatouille"],
  "Rispappersrullar med cashewdipp": ["Spring Roll", "Rice Paper"],
  "Röd chili med skaldjur": ["Seafood Chili", "Seafood Noodle"],
  "Sesampanerad tonfisk med chilimajonnäs": ["Tuna", "Seared Tuna"],
  "Smörgåstårta": ["Sandwich Cake"],
  "Sojamarinerad lax på spett": ["Salmon Teriyaki", "Salmon Skewer"],
  "Souvlakia": ["Chicken Souvlaki", "Souvlaki"],
  "Stekt blomkål i skivor": ["Roasted Cauliflower", "Cauliflower Steak"],
  "Stekt getost på salladsbädd": ["Goat Cheese Salad"],
  "Thailändsk slaw med jordnötter": ["Thai Salad", "Coleslaw"],
  "Tom Kha Goong": ["Tom Kha Gai", "Thai Soup"],
  "Torsk med oliver och kronärtskocka": ["Cod", "Fish"],
  "Ugnsbakad kall lax": ["Baked Salmon", "Salmon"],
  "Ugnslagad lax": ["Salmon Cream", "Baked Salmon"],
  "Världens godaste plättar": ["Pancake", "Swedish Pancake"],
  "Vitlöks- och pepparkyckling": ["Garlic Chicken", "Pepper Chicken"],
};

const wikiSearchMap = {
  "Alex's club Sandwich": "club sandwich food",
  "Allt i allo gryta": "beef stew",
  "Ananaspaj": "pineapple pie",
  "Basilikagnudi med broccoli": "gnudi pasta broccoli",
  "Biffwok i soja": "beef stir fry wok",
  "Blomkålssoppa med bacon och ruccolaolja": "cauliflower soup",
  "Blomkålssoppa med vitlöksbaguette": "cauliflower cream soup",
  "Broccoli och kasslergratäng": "broccoli gratin",
  "Broccolitimbal": "broccoli timbale",
  "Couscoussallad med rostade grönsaker och het sås": "couscous vegetables",
  "Den bästa vegetariska lasagnen": "vegetable lasagna",
  "Ett stort bröd": "artisan bread round",
  "Fänkål- och morotssoppa med apelsin": "carrot fennel soup",
  "Fläskfilé med pesto": "pork tenderloin pesto",
  "Förälskade havskräftor": "langoustine flambe",
  "Gräddig räksoppa": "shrimp bisque soup",
  "Gratinerad hummer": "lobster thermidor",
  "Gratinerade sniglar": "escargot bourguignon",
  "Gudomliga skorpor": "swedish rusk skorpa",
  "Gulaschsoppa från Österrike": "goulash soup",
  "Hummersoppa": "lobster bisque",
  "Japansk fondue": "shabu shabu japanese",
  "Klassisk löksoppa": "french onion soup",
  "Korvbröd": "bread rolls buns",
  "Kräftspad": "crayfish dill",
  "Krämiga nudlar med röd curry och krispig fräs": "red curry noodles",
  "Kyckling med getost": "chicken goat cheese baked",
  "Kycklinggryta med grov senap och dragon": "chicken mustard tarragon",
  "Kycklingkebab": "chicken kebab shawarma",
  "Kycklingsoppa": "chicken noodle soup",
  "Lamm med pistage och harissa-morötter": "pistachio crusted lamb",
  "Langos med tomater, mozzarella och pesto": "langos hungarian fried bread",
  "Lasagne med köttfärs": "meat lasagna",
  "Lax på rotfruktsbädd": "salmon root vegetable",
  "Leilas chocolate cupcakes": "chocolate cupcake frosting",
  "Löksoppa (Tarte à l'oignon)": "tarte oignon onion",
  "Mormors saftiga äppelkaka": "swedish apple cake",
  "Nongs super syrliga räksoppa": "tom yum goong shrimp",
  "Paprikaskal med guacamole": "potato skins guacamole",
  "Pasta med kalvfrikadeller i tomatsås": "meatballs pasta tomato",
  "Pasta med kronärtskocka och citron": "pasta artichoke lemon",
  "Pasta med rostad blomkål": "roasted cauliflower pasta",
  "Pâté Brisée - fransk äppelkaka": "tarte aux pommes french apple",
  "Potatis och fänkålsgratäng": "potato gratin fennel",
  "Potatis- och purjolökssoppa": "potato leek soup",
  "Potatiskroketter": "potato croquettes",
  "Provencalsk kycklinggryta": "chicken provencal",
  "Ratatouillegryta med vitlöksbakad sej": "ratatouille fish",
  "Rispappersrullar med cashewdipp": "vietnamese spring rolls",
  "Röd chili med skaldjur": "seafood chili noodles",
  "Sesampanerad tonfisk med chilimajonnäs": "seared tuna sesame",
  "Smörgåstårta": "smörgåstårta sandwich",
  "Sojamarinerad lax på spett": "teriyaki salmon",
  "Souvlakia": "chicken souvlaki",
  "Stekt blomkål i skivor": "cauliflower steak",
  "Stekt getost på salladsbädd": "fried goat cheese salad",
  "Thailändsk slaw med jordnötter": "thai coleslaw peanut",
  "Tom Kha Goong": "tom kha gai",
  "Torsk med oliver och kronärtskocka": "cod fish olives",
  "Ugnsbakad kall lax": "cold salmon dill",
  "Ugnslagad lax": "baked salmon cream",
  "Världens godaste plättar": "swedish pancakes",
  "Vitlöks- och pepparkyckling": "garlic pepper chicken basil",
};

async function downloadAndUpload(imageUrl, recipeTitle) {
  try {
    const imgRes = await fetch(imageUrl, {
      headers: { "User-Agent": "FrostRecipeApp/1.0" },
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
    process.stdout.write(`  ${recipe.title}...`);
    let imageUrl = null;

    const mealTerms = mealDbMap[recipe.title] || [];
    for (const term of mealTerms) {
      imageUrl = await searchTheMealDB(term);
      if (imageUrl) { process.stdout.write(` [MealDB: ${term}]`); break; }
    }

    if (!imageUrl) {
      const wikiTerm = wikiSearchMap[recipe.title] || recipe.title;
      imageUrl = await searchWikimedia(wikiTerm);
      if (imageUrl) process.stdout.write(" [Wiki]");
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
