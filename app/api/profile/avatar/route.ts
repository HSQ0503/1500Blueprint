import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { supabaseAdmin } from "@/utils/supabase/admin";

// Profile picture upload. Stores into the public "figures" bucket under an
// avatars/ prefix (the same bucket the flashcard/test images use) and saves the
// resulting public URL onto the signed-in user's row. Any member may set their
// own; SVG is intentionally disallowed (script-in-image risk for a public URL).
const BUCKET = "figures";
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
};

async function ensureBucket() {
  const db = supabaseAdmin();
  const { data } = await db.storage.getBucket(BUCKET);
  if (!data) {
    const { error } = await db.storage.createBucket(BUCKET, { public: true });
    if (error && !/already exists/i.test(error.message)) throw error;
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "no_file" }, { status: 400 });

  const ext = ALLOWED[file.type];
  if (!ext) return NextResponse.json({ error: "unsupported_type" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "too_large" }, { status: 400 });

  try {
    const db = supabaseAdmin();
    await ensureBucket();
    const buffer = Buffer.from(await file.arrayBuffer());
    const path = `avatars/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await db.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: false });
    if (upErr) return NextResponse.json({ error: "upload_failed" }, { status: 500 });

    const url = db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    const { error: saveErr } = await db
      .from("users")
      .update({ avatar_url: url })
      .eq("email", session.email);
    if (saveErr) {
      console.error("avatar save failed:", saveErr.message);
      return NextResponse.json({ error: "save_failed" }, { status: 500 });
    }
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }
}

// Remove the current profile picture (revert to initials).
export async function DELETE() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { error } = await supabaseAdmin()
    .from("users")
    .update({ avatar_url: null })
    .eq("email", session.email);
  if (error) {
    console.error("avatar remove failed:", error.message);
    return NextResponse.json({ error: "remove_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
