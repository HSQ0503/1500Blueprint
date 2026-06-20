"use client";

import { useState } from "react";
import type { ModuleVariant, PracticeTest } from "@/lib/sat/types";

type ModuleJump = {
  label: string;
  sectionIndex: number;
  moduleOrder: 1 | 2;
  variant?: ModuleVariant;
};

// Dev-only navigation aid: jump straight to any module (skipping the adaptive
// routing) or the results screen. Rendered only for dev sessions in non-prod.
export function DevJumpMenu({
  test,
  onJumpModule,
  onJumpResults,
}: {
  test: PracticeTest;
  onJumpModule: (sectionIndex: number, moduleOrder: 1 | 2, variant?: ModuleVariant) => void;
  onJumpResults: () => void;
}) {
  const [open, setOpen] = useState(false);

  const jumps: ModuleJump[] = test.sections.flatMap((s, si) => [
    { label: `${s.shortName} · Module 1`, sectionIndex: si, moduleOrder: 1 },
    { label: `${s.shortName} · Module 2 (easy)`, sectionIndex: si, moduleOrder: 2, variant: "easy" },
    { label: `${s.shortName} · Module 2 (hard)`, sectionIndex: si, moduleOrder: 2, variant: "hard" },
  ]);

  return (
    <div className="fixed bottom-3 left-3 z-50 select-none text-xs">
      {open && (
        <div className="mb-2 w-60 overflow-hidden rounded-lg border border-white/10 bg-neutral-900 text-white shadow-2xl">
          <div className="border-b border-white/10 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-amber-400">
            Dev · jump to
          </div>
          <ul className="py-1">
            {jumps.map((j) => (
              <li key={j.label}>
                <button
                  type="button"
                  onClick={() => {
                    onJumpModule(j.sectionIndex, j.moduleOrder, j.variant);
                    setOpen(false);
                  }}
                  className="block w-full px-3 py-1.5 text-left transition-colors hover:bg-white/10"
                >
                  {j.label}
                </button>
              </li>
            ))}
            <li className="border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  onJumpResults();
                  setOpen(false);
                }}
                className="block w-full px-3 py-1.5 text-left transition-colors hover:bg-white/10"
              >
                Results screen
              </button>
            </li>
          </ul>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-full bg-amber-500 px-3.5 py-1.5 font-bold text-black shadow-lg transition-colors hover:bg-amber-400"
      >
        {open ? "✕ Dev" : "⚡ Dev"}
      </button>
    </div>
  );
}
