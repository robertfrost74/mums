import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const { title, recipeId } = await request.json();
  if (!title || typeof title !== "string") {
    return NextResponse.json({ error: "Ingen titel angiven" }, { status: 400 });
  }

  const imageUrl = await findImage(title);
  if (!imageUrl) {
    return NextResponse.json({ error: "Kunde inte hitta någon bild" }, { status: 404 });
  }

  const storedUrl = await downloadAndStore(imageUrl, title);
  if (!storedUrl) {
    return NextResponse.json({ error: "Kunde inte spara bilden" }, { status: 500 });
  }

  if (recipeId) {
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    await serviceClient
      .from("recipes")
      .update({ image_url: storedUrl })
      .eq("id", recipeId);
  }

  return NextResponse.json({ url: storedUrl });
}

async function findImage(title: string): Promise<string | null> {
  const url = await searchReceptSe(title);
  if (url) return url;

  const simplified = title.split(" ").slice(0, 3).join(" ");
  if (simplified !== title) {
    const url2 = await searchReceptSe(simplified);
    if (url2) return url2;
  }

  const english = await searchTheMealDB(title);
  if (english) return english;

  return null;
}

async function searchReceptSe(query: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://recept.se/sok?q=${encodeURIComponent(query)}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
      },
    );
    if (!res.ok) return null;
    const html = await res.text();
    const matches =
      html.match(
        /https:\/\/images\.recept\.se\/images\/recipes\/[^\s"']+\.(jpg|jpeg|png|webp)/gi,
      ) || [];
    const unique = Array.from(new Set(matches)).filter(
      (u) => !u.includes("placeholder"),
    );
    return unique[0] || null;
  } catch {
    return null;
  }
}

async function searchTheMealDB(query: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.meals?.[0]?.strMealThumb) return data.meals[0].strMealThumb;
    return null;
  } catch {
    return null;
  }
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[åä]/g, "a")
    .replace(/ö/g, "o")
    .replace(/é/g, "e")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function downloadAndStore(
  imageUrl: string,
  title: string,
): Promise<string | null> {
  try {
    const imgRes = await fetch(imageUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      redirect: "follow",
    });
    if (!imgRes.ok) return null;

    const contentType = imgRes.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    if (buffer.length < 5000) return null;

    const ext = contentType.includes("png")
      ? "png"
      : contentType.includes("webp")
        ? "webp"
        : "jpg";
    const path = `recipes/${slugify(title)}-${Date.now()}.${ext}`;

    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { error } = await serviceClient.storage
      .from("recipe-images")
      .upload(path, buffer, { upsert: true, contentType });

    if (error) return null;

    const { data } = serviceClient.storage
      .from("recipe-images")
      .getPublicUrl(path);

    return data.publicUrl;
  } catch {
    return null;
  }
}
