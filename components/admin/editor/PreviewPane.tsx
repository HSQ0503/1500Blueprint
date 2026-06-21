"use client";

import type { DrillQuestion } from "@/lib/drills/types";
import { DownloadPng } from "@/components/admin/editor/DownloadPng";
import { PREVIEWS } from "@/components/admin/editor/registry";
import { label } from "@/components/drills/shared/ui";

// Live, student-faithful render of the question being edited, wrapped in a
// DownloadPng so the author can export the card. Looks up the per-drill Preview
// from the registry and degrades gracefully if a slug has none.
export function PreviewPane({ question }: { question: DrillQuestion }) {
  const Preview = PREVIEWS[question.drillSlug];

  return (
    <div className="flex flex-col gap-3">
      <h2 className={`${label} text-navy/55`}>Live Preview</h2>

      {Preview ? (
        <DownloadPng fileName={`${question.drillSlug}-${question.id}.png`}>
          <Preview question={question} />
        </DownloadPng>
      ) : (
        <p className="rounded-card border border-dashed border-navy/20 bg-mist px-4 py-6 text-center text-sm text-navy/45">
          No preview available for the “{question.drillSlug}” drill.
        </p>
      )}
    </div>
  );
}
