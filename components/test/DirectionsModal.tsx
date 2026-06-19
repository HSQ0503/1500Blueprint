"use client";

import { useEffect } from "react";
import type { Section } from "@/lib/sat/types";

// Plain-language directions written for this app. Opens as a left-anchored
// panel over a dimmed screen, with a yellow Close button (Bluebook style).
export function DirectionsModal({
  section,
  onClose,
}: {
  section: Section;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 font-exam-sans">
      <button
        type="button"
        aria-label="Close directions"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/30"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Directions"
        className="absolute left-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
      >
        <div className="flex-1 overflow-y-auto px-7 py-7 text-[15px] leading-7 text-exam-ink">
          {section.id === "rw" ? (
            <div className="space-y-3">
              <p>
                The questions in this section address a number of important reading
                and writing skills. Each question is based on one or more passages,
                which may include a table or graph. Read each passage and question
                carefully, and then choose the best answer.
              </p>
              <p>
                All questions in this section are multiple-choice with four answer
                choices. Each question has a single best answer.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <p>
                The questions in this section address a number of important math
                skills. Use of a calculator is permitted for all questions.
              </p>
              <p>
                For multiple-choice questions, choose the best of the four answer
                choices. For student-produced response questions, type your answer
                in the box. Fractions and decimals are accepted; do not enter
                symbols such as %, commas, or $.
              </p>
            </div>
          )}
        </div>
        <div className="flex justify-center border-t border-exam-border px-7 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-gold px-8 py-2 text-[14px] font-bold text-black hover:bg-gold-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
