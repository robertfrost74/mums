#!/usr/bin/env node
/**
 * Updates all recipes in the database with image URLs.
 * Sources: TheMealDB (free API) + Unsplash (free license).
 */

const SUPABASE_URL = "https://znpjchdmshvdzmwjfbfw.supabase.co";
const SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpucGpjaGRtc2h2ZHptd2pmYmZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTgzODkyOCwiZXhwIjoyMDkxNDE0OTI4fQ.5WPMhDRUXebeGYfwGG84L6GIi9GS4CWyEczbuJK4_4I";

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

const imageMap = {
  // ── TheMealDB images ───────────────────────────────────
  "Biff stroganoff": "https://www.themealdb.com/images/media/meals/svprys1511176755.jpg",
  "Boeuf Bourguignon": "https://www.themealdb.com/images/media/meals/vtqxtu1511784197.jpg",
  "Chorizolasagne": "https://www.themealdb.com/images/media/meals/wtsvxx1511296896.jpg",
  "Den fulländade spagetti bolognesen": "https://www.themealdb.com/images/media/meals/sutysw1468247559.jpg",
  "Potatisgratäng": "https://www.themealdb.com/images/media/meals/qwrtut1468418027.jpg",
  "Champinjonsoppa": "https://www.themealdb.com/images/media/meals/1ngcbf1628770793.jpg",
  "Gratinerad löksoppa": "https://www.themealdb.com/images/media/meals/xvrrux1511783685.jpg",
  "Tomatsoppa med ricottagnocchi": "https://www.themealdb.com/images/media/meals/stpuws1511191310.jpg",
  "Mormors mörka chokladtårta": "https://www.themealdb.com/images/media/meals/tqtywx1468317395.jpg",
  "Farmors äppelkakor": "https://www.themealdb.com/images/media/meals/c0gmo31766594751.jpg",
  "Morotsrulltårta": "https://www.themealdb.com/images/media/meals/vrspxv1511722107.jpg",
  "Paella": "https://www.themealdb.com/images/media/meals/9bl20p1763248192.jpg",

  // ── Unsplash images (free license) ─────────────────────
  "Aubergineröra": "https://images.unsplash.com/photo-1700481955246-a45a4633ab1a?w=800&q=80&fit=crop",
  "Chicken tikka masala": "https://images.unsplash.com/photo-1742599361574-6fb156181466?w=800&q=80&fit=crop",
  "Evas Kladdkaka": "https://images.unsplash.com/photo-1570145820259-b5b80c5c8bd6?w=800&q=80&fit=crop",
  "Chili rellenos": "https://images.unsplash.com/photo-1708536892634-18ccb18cd513?w=800&q=80&fit=crop",
  "Chili Snacks med räkor": "https://images.unsplash.com/photo-1582169296194-e4d644c48063?w=800&q=80&fit=crop",
  "Curry kyckling gratäng": "https://images.unsplash.com/photo-1771161409348-a87ca16dbc39?w=800&q=80&fit=crop",
  "Het ananas- & mangosalsa": "https://images.unsplash.com/photo-1690944082404-571906f9abc4?w=800&q=80&fit=crop",
  "Minifritters": "https://images.unsplash.com/photo-1734774924912-dcbb467f8599?w=800&q=80&fit=crop",
  "Mousse de roquefort": "https://images.unsplash.com/photo-1627308595127-d9acf19107ce?w=800&q=80&fit=crop",
  "Salamichips": "https://images.unsplash.com/photo-1768758922103-a75510006b78?w=800&q=80&fit=crop",
  "Alex godaste gryta": "https://images.unsplash.com/photo-1664741662725-bd131742b7b7?w=800&q=80&fit=crop",
  "Alex's chili con carne": "https://images.unsplash.com/photo-1666819632298-fe15dc7d4c34?w=800&q=80&fit=crop",
  "Alexs citronpasta med skaldjur": "https://images.unsplash.com/photo-1481931098730-318b6f776db0?w=800&q=80&fit=crop",
  "Quiche lorraine": "https://images.unsplash.com/photo-1650844010413-3f24dc1c182b?w=800&q=80&fit=crop",
  "Matig tacopaj": "https://images.unsplash.com/photo-1517978160212-7dddf0b65934?w=800&q=80&fit=crop",
  "Pad krapow": "https://images.unsplash.com/photo-1775813240698-00793501786b?w=800&q=80&fit=crop",
  "Yakiniku": "https://images.unsplash.com/photo-1663569820326-fece03afdf1c?w=800&q=80&fit=crop",
  "Österrikisk ostfondue": "https://images.unsplash.com/photo-1630257574313-9bacc3c521d8?w=800&q=80&fit=crop",
  "Aioli": "https://images.unsplash.com/photo-1636970962753-e3fbfc7ef1c0?w=800&q=80&fit=crop",
  "Smör med fin kryddning": "https://images.unsplash.com/photo-1589985269102-ff38adf6f00d?w=800&q=80&fit=crop",
  "Blomkålssoppa": "https://images.unsplash.com/photo-1578859318509-62790b079366?w=800&q=80&fit=crop",
  "Kokossoppa med lax och ingefära": "https://images.unsplash.com/photo-1613844237701-8f3664fc2eff?w=800&q=80&fit=crop",
  "Hallonsmulpaj": "https://images.unsplash.com/photo-1693464337393-746af7c390d5?w=800&q=80&fit=crop",
  "Bullar": "https://images.unsplash.com/photo-1645995575875-ea6511c9d127?w=800&q=80&fit=crop",
  "Chokladbollar": "https://images.unsplash.com/photo-1639158924965-7be3bb57506b?w=800&q=80&fit=crop",
  "Focaccia Bröd": "https://images.unsplash.com/photo-1619452357216-e88ca8119eeb?w=800&q=80&fit=crop",
  "Godaste lussebullen": "https://images.unsplash.com/photo-1743075228379-7d90a4b9a623?w=800&q=80&fit=crop",
  "Knådfritt Grytbröd": "https://images.unsplash.com/photo-1534620808146-d33bb39128b2?w=800&q=80&fit=crop",
  "Kräftlag": "https://images.unsplash.com/photo-1747893062289-4168c3303368?w=800&q=80&fit=crop",
  "Ninnis Super Crunch": "https://images.unsplash.com/photo-1559951585-645e730d3cf0?w=800&q=80&fit=crop",
  "Stekfond": "https://images.unsplash.com/photo-1775481494777-58a786c84303?w=800&q=80&fit=crop",
};

async function main() {
  const familyId = process.argv[2];
  if (!familyId) {
    console.error("Användning: node supabase/update-images.mjs <family_id>");
    process.exit(1);
  }

  console.log(`Uppdaterar bilder för familj ${familyId}…\n`);

  let ok = 0;
  let fail = 0;

  for (const [title, imageUrl] of Object.entries(imageMap)) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/recipes?title=eq.${encodeURIComponent(title)}&family_id=eq.${familyId}`,
        {
          method: "PATCH",
          headers: { ...headers, Prefer: "return=minimal" },
          body: JSON.stringify({ image_url: imageUrl }),
        },
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status}: ${text}`);
      }

      console.log(`  ✓ ${title}`);
      ok++;
    } catch (e) {
      console.error(`  ✗ ${title}: ${e.message}`);
      fail++;
    }
  }

  console.log(`\nKlart! ${ok} uppdaterade, ${fail} misslyckades.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
