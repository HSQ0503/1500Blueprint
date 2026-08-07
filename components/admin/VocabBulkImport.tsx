"use client";

import { useState, type FormEvent } from "react";

type ImportResponse = {
  ok?: boolean;
  imported?: number;
  inserted?: number;
  updated?: number;
  error?: string;
  errors?: string[];
  errorCount?: number;
  validRows?: number;
};

export function VocabBulkImport() {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<ImportResponse | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setPending(true);
    setResult(null);
    try {
      const response = await fetch("/admin/api/drills/vocab/import", { method: "POST", body: data });
      const body = (await response.json()) as ImportResponse;
      setResult(body);
      if (response.ok) form.reset();
    } catch {
      setResult({ error: "The upload could not be completed. Check your connection and try again." });
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mt-6 rounded-2xl bg-white p-6 shadow-pop">
      <div className="max-w-2xl">
        <div className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-brand-600">Word bank</div>
        <h2 className="mt-1 font-display text-xl font-bold text-navy">Bulk import vocabulary</h2>
        <p className="mt-2 text-sm leading-6 text-navy/55">
          Upload CSV, TSV, pipe-delimited TXT, or JSON. Include <strong>word</strong> and <strong>definition</strong>;
          <strong> part of speech</strong> and <strong>example</strong> are optional. Files with 1,000+ words are supported.
        </p>
      </div>

      <form onSubmit={submit} className="mt-5 flex flex-wrap items-center gap-3">
        <input
          type="file"
          name="file"
          required
          accept=".csv,.tsv,.txt,.json,text/csv,text/tab-separated-values,text/plain,application/json"
          className="min-w-0 flex-1 rounded-card border border-navy/15 bg-haze px-3 py-2.5 text-sm text-navy file:mr-3 file:rounded-chip file:border-0 file:bg-navy file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-card bg-brand px-5 py-3 text-sm font-bold text-white shadow-[0_2px_0_#2b8fe0] disabled:cursor-wait disabled:opacity-55"
        >
          {pending ? "Importing…" : "Import and publish"}
        </button>
      </form>

      {result?.ok ? (
        <div role="status" className="mt-4 rounded-card border border-success/25 bg-success-bg px-4 py-3 text-sm text-success-600">
          Imported {result.imported} words: {result.inserted} new and {result.updated} updated.
        </div>
      ) : null}
      {result?.error ? (
        <div role="alert" className="mt-4 rounded-card border border-danger/25 bg-danger-bg px-4 py-3 text-sm text-danger-600">
          <p className="font-semibold">{result.error}</p>
          {typeof result.validRows === "number" ? <p className="mt-1">Valid rows found: {result.validRows}</p> : null}
          {result.errors?.length ? (
            <ul className="mt-2 max-h-48 list-disc space-y-1 overflow-y-auto pl-5">
              {result.errors.map((error, index) => <li key={`${error}-${index}`}>{error}</li>)}
            </ul>
          ) : null}
          {(result.errorCount ?? 0) > (result.errors?.length ?? 0) ? (
            <p className="mt-2">Plus {(result.errorCount ?? 0) - (result.errors?.length ?? 0)} more errors.</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
