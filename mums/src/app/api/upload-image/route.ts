import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const remoteUrl = formData.get("remoteUrl") as string | null;
  const filename = formData.get("filename") as string | null;

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const safeName = (filename || "image")
    .toLowerCase()
    .replace(/[åä]/g, "a")
    .replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  let buffer: Buffer;
  let contentType: string;
  let ext: string;

  if (file) {
    buffer = Buffer.from(await file.arrayBuffer());
    contentType = file.type;
    ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  } else if (remoteUrl) {
    const imgRes = await fetch(remoteUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      redirect: "follow",
    });
    if (!imgRes.ok) {
      return NextResponse.json({ error: "Kunde inte hämta bilden" }, { status: 422 });
    }
    buffer = Buffer.from(await imgRes.arrayBuffer());
    contentType = imgRes.headers.get("content-type") || "image/jpeg";
    ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
  } else {
    return NextResponse.json({ error: "Ingen fil eller URL" }, { status: 400 });
  }

  const path = `recipes/${safeName}-${Date.now()}.${ext}`;

  const { error: uploadErr } = await serviceClient.storage
    .from("recipe-images")
    .upload(path, buffer, { upsert: true, contentType });

  if (uploadErr) {
    return NextResponse.json({ error: uploadErr.message }, { status: 500 });
  }

  const { data } = serviceClient.storage.from("recipe-images").getPublicUrl(path);

  return NextResponse.json({ url: data.publicUrl });
}
