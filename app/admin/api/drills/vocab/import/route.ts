import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/requireAdmin";
import { importVocabEntries } from "@/lib/drills/admin-queries";
import { parseVocabImport } from "@/lib/drills/vocabImport";

const MAX_IMPORT_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose a CSV, TSV, TXT, or JSON file." }, { status: 400 });
  }
  if (file.size > MAX_IMPORT_BYTES) {
    return NextResponse.json({ error: "The import file must be 10 MB or smaller." }, { status: 413 });
  }

  const parsed = parseVocabImport(await file.text(), file.name);
  if (parsed.entries.length === 0 || parsed.errors.length > 0) {
    return NextResponse.json(
      {
        error: parsed.entries.length === 0 ? "No valid vocab words were found." : "Fix the reported rows and upload again.",
        validRows: parsed.entries.length,
        errors: parsed.errors.slice(0, 100),
        errorCount: parsed.errors.length,
      },
      { status: 400 },
    );
  }
  if (parsed.entries.length < 4) {
    return NextResponse.json(
      { error: "Include at least four unique words so every question has four answer choices." },
      { status: 400 },
    );
  }

  try {
    const outcome = await importVocabEntries(parsed.entries, session.email);
    return NextResponse.json({ ok: true, ...outcome });
  } catch (error) {
    console.error("Vocab import failed", error);
    return NextResponse.json({ error: "The vocab import could not be saved." }, { status: 500 });
  }
}
