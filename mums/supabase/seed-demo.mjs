import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://znpjchdmshvdzmwjfbfw.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY. Run with:");
  console.error("  SUPABASE_SERVICE_ROLE_KEY=... node supabase/seed-demo.mjs");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_EMAIL = "demo@mums.app";
const DEMO_PASSWORD = "demo1234";

async function main() {
  console.log("1/4  Creating demo user...");

  // Check if user already exists
  const { data: existing } = await supabase.auth.admin.listUsers();
  const demoUser = existing?.users?.find((u) => u.email === DEMO_EMAIL);

  let userId;
  if (demoUser) {
    console.log("     Demo user already exists, skipping creation.");
    userId = demoUser.id;
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { family_name: "Demofamiljen" },
    });
    if (error) {
      console.error("Failed to create user:", error.message);
      process.exit(1);
    }
    userId = data.user.id;
    console.log("     Created user:", userId);
  }

  console.log("2/4  Finding demo family...");
  const { data: membership } = await supabase
    .from("family_members")
    .select("family_id")
    .eq("user_id", userId)
    .limit(1)
    .single();

  if (!membership) {
    console.error("No family found for demo user. Check the handle_new_user trigger.");
    process.exit(1);
  }

  const familyId = membership.family_id;
  console.log("     Family ID:", familyId);

  // Check if recipes already exist
  const { count } = await supabase
    .from("recipes")
    .select("id", { count: "exact", head: true })
    .eq("family_id", familyId);

  if (count > 0) {
    console.log(`     ${count} recipes already exist. Skipping seed.`);
    console.log("\nDone! Demo login: demo@mums.app / demo1234");
    return;
  }

  console.log("3/4  Inserting demo recipes...");

  const recipes = [
    {
      title: "Klassiska Köttbullar",
      description: "Mormors svenska köttbullar med gräddsås.",
      instructions: "1. Blötlägg ströbröd i mjölk.\n2. Blanda färs, ägg, lök, salt och peppar.\n3. Rulla bollar, stek i smör ca 5 min.\n4. Gör gräddsås: stek mjöl i stekskyn, rör i grädde och buljong.\n5. Servera med potatismos och lingon.",
      category: "Husmanskost",
      servings: 4, prep_time: 20, cook_time: 15,
      image_url: "https://images.unsplash.com/photo-1529042410759-befb1204b468?w=800",
      ingredients: [
        { ingredient: "Köttfärs (blandfärs)", amount: "500", unit: "g" },
        { ingredient: "Ströbröd", amount: "1", unit: "dl" },
        { ingredient: "Mjölk", amount: "1", unit: "dl" },
        { ingredient: "Ägg", amount: "1", unit: "st" },
        { ingredient: "Lök, finhackad", amount: "1", unit: "st" },
        { ingredient: "Salt", amount: "1", unit: "tsk" },
        { ingredient: "Peppar", amount: "", unit: "" },
        { ingredient: "Smör till stekning", amount: "2", unit: "msk" },
      ],
    },
    {
      title: "Pannkakor",
      description: "Tunna svenska pannkakor – perfekt till lunch eller mellis.",
      instructions: "1. Vispa ihop ägg, mjöl och salt.\n2. Tillsätt mjölken lite i taget.\n3. Rör ner smält smör.\n4. Stek tunna pannkakor i het panna.\n5. Servera med sylt och grädde.",
      category: "Lunch",
      servings: 4, prep_time: 5, cook_time: 15,
      image_url: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800",
      ingredients: [
        { ingredient: "Ägg", amount: "3", unit: "st" },
        { ingredient: "Vetemjöl", amount: "3", unit: "dl" },
        { ingredient: "Mjölk", amount: "6", unit: "dl" },
        { ingredient: "Salt", amount: "½", unit: "tsk" },
        { ingredient: "Smör, smält", amount: "2", unit: "msk" },
      ],
    },
    {
      title: "Laxfilé med dillsås",
      description: "Enkel ugnsbakad lax med krämig dillsås.",
      instructions: "1. Ugn 200°C.\n2. Lägg laxfilén i en ugnsform, salta och peppra.\n3. Baka 15–18 min.\n4. Dillsås: blanda crème fraîche, hackad dill, citron, salt och peppar.\n5. Servera med kokt potatis och grönsaker.",
      category: "Fisk",
      servings: 4, prep_time: 10, cook_time: 18,
      image_url: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800",
      ingredients: [
        { ingredient: "Laxfilé", amount: "4", unit: "st" },
        { ingredient: "Crème fraîche", amount: "2", unit: "dl" },
        { ingredient: "Dill, hackad", amount: "3", unit: "msk" },
        { ingredient: "Citron", amount: "½", unit: "st" },
        { ingredient: "Salt och peppar", amount: "", unit: "" },
      ],
    },
    {
      title: "Pasta Carbonara",
      description: "Krämig italiensk klassiker med ägg, parmesan och pancetta.",
      instructions: "1. Koka pasta al dente.\n2. Stek tärnad pancetta knaprig.\n3. Vispa ägg med riven parmesan.\n4. Blanda het pasta med pancetta.\n5. Ta från värmen, rör i äggblandningen snabbt.\n6. Servera direkt med svartpeppar.",
      category: "Pasta",
      servings: 4, prep_time: 10, cook_time: 15,
      image_url: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800",
      ingredients: [
        { ingredient: "Spaghetti", amount: "400", unit: "g" },
        { ingredient: "Pancetta", amount: "150", unit: "g" },
        { ingredient: "Äggula", amount: "4", unit: "st" },
        { ingredient: "Parmesan, riven", amount: "1", unit: "dl" },
        { ingredient: "Svartpeppar", amount: "", unit: "" },
      ],
    },
    {
      title: "Chokladbollar",
      description: "Snabba, no-bake chokladbollar – klara på 15 min!",
      instructions: "1. Blanda havregryn, socker, kakao, vaniljsocker och kallt kaffe.\n2. Rör ner smält smör.\n3. Rulla bollar och rulla i kokos eller pärlsocker.\n4. Ställ kallt 30 min.",
      category: "Fika",
      servings: 20, prep_time: 15, cook_time: 0,
      image_url: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=800",
      ingredients: [
        { ingredient: "Havregryn", amount: "5", unit: "dl" },
        { ingredient: "Socker", amount: "2", unit: "dl" },
        { ingredient: "Kakao", amount: "3", unit: "msk" },
        { ingredient: "Vaniljsocker", amount: "2", unit: "tsk" },
        { ingredient: "Kallt kaffe", amount: "3", unit: "msk" },
        { ingredient: "Smör, smält", amount: "100", unit: "g" },
        { ingredient: "Kokos", amount: "", unit: "" },
      ],
    },
    {
      title: "Tomatsoppa",
      description: "Värmande tomatsoppa med basilika – perfekt en kall dag.",
      instructions: "1. Fräs hackad lök och vitlök i olivolja.\n2. Tillsätt krossade tomater, buljong och basilika.\n3. Låt koka 15 min.\n4. Mixa slät.\n5. Smaka av med salt, peppar och en nypa socker.\n6. Servera med osttoast.",
      category: "Soppa",
      servings: 4, prep_time: 10, cook_time: 20,
      image_url: "https://images.unsplash.com/photo-1620418025834-f4379baf1de9?w=800",
      ingredients: [
        { ingredient: "Krossade tomater", amount: "2", unit: "burkar" },
        { ingredient: "Lök", amount: "1", unit: "st" },
        { ingredient: "Vitlök", amount: "2", unit: "klyftor" },
        { ingredient: "Grönsaksbuljong", amount: "4", unit: "dl" },
        { ingredient: "Basilika", amount: "1", unit: "kruka" },
        { ingredient: "Olivolja", amount: "2", unit: "msk" },
      ],
    },
    {
      title: "Tacos",
      description: "Fredagsmys! Kryddig färs med alla tillbehör.",
      instructions: "1. Stek köttfärs med tacokrydda.\n2. Skölj och strimla sallad.\n3. Tärna tomater, gurka och lök.\n4. Riv ost.\n5. Värm tortillas.\n6. Duka upp allt i skålar och bygg din egna taco!",
      category: "Fredagsmys",
      servings: 4, prep_time: 15, cook_time: 10,
      image_url: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800",
      ingredients: [
        { ingredient: "Köttfärs", amount: "500", unit: "g" },
        { ingredient: "Tacokrydda", amount: "1", unit: "påse" },
        { ingredient: "Tortillas", amount: "8", unit: "st" },
        { ingredient: "Sallad", amount: "1", unit: "st" },
        { ingredient: "Tomat", amount: "3", unit: "st" },
        { ingredient: "Rödlök", amount: "1", unit: "st" },
        { ingredient: "Riven ost", amount: "2", unit: "dl" },
        { ingredient: "Gräddfil", amount: "2", unit: "dl" },
        { ingredient: "Salsa", amount: "1", unit: "burk" },
      ],
    },
    {
      title: "Kanelbullar",
      description: "Saftiga, hemgjorda kanelbullar med kardemumma.",
      instructions: "1. Värm mjölk, smält smör i den.\n2. Blanda jäst, socker, kardemumma, salt och mjöl.\n3. Knåda 10 min, jäs 40 min.\n4. Kavla ut, bred på smör-socker-kanelfyllning.\n5. Rulla ihop och skär bitar. Jäs 30 min.\n6. Pensla med ägg, strö pärlsocker. Grädda 225°C i 8–10 min.",
      category: "Fika",
      servings: 20, prep_time: 30, cook_time: 10,
      image_url: "https://images.unsplash.com/photo-1523198205441-99fac53d157f?w=800",
      ingredients: [
        { ingredient: "Vetemjöl", amount: "8", unit: "dl" },
        { ingredient: "Mjölk", amount: "2.5", unit: "dl" },
        { ingredient: "Jäst", amount: "25", unit: "g" },
        { ingredient: "Smör", amount: "75", unit: "g" },
        { ingredient: "Socker", amount: "¾", unit: "dl" },
        { ingredient: "Kardemumma", amount: "1", unit: "tsk" },
        { ingredient: "Kanel (fyllning)", amount: "2", unit: "msk" },
        { ingredient: "Smör (fyllning)", amount: "75", unit: "g" },
        { ingredient: "Socker (fyllning)", amount: "¾", unit: "dl" },
      ],
    },
  ];

  for (const r of recipes) {
    const { ingredients, ...recipeData } = r;
    const { data: inserted, error } = await supabase
      .from("recipes")
      .insert({ ...recipeData, family_id: familyId, is_active: true, created_by: userId })
      .select("id")
      .single();

    if (error) {
      console.error(`  Failed to insert "${r.title}":`, error.message);
      continue;
    }

    console.log(`     + ${r.title}`);

    if (ingredients.length > 0) {
      const rows = ingredients.map((ing, i) => ({
        recipe_id: inserted.id,
        ...ing,
        sort_order: i + 1,
      }));
      await supabase.from("recipe_ingredients").insert(rows);
    }
  }

  console.log("4/4  Done!");
  console.log("\n     Demo login: demo@mums.app / demo1234");
}

main().catch(console.error);
