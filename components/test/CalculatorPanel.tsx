"use client";

import { useRef, useState } from "react";
import { CloseIcon, ExpandIcon, GripIcon } from "./icons";

// Embeds the Desmos graphing calculator (the same tool used in Bluebook),
// in a draggable, resizable floating panel.
export function CalculatorPanel({ onClose }: { onClose: () => void }) {
  const [pos, setPos] = useState({ x: 40, y: 96 });
  const [big, setBig] = useState(false);
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  function onPointerDown(e: React.PointerEvent) {
    drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current) return;
    setPos({
      x: Math.max(0, e.clientX - drag.current.dx),
      y: Math.max(0, e.clientY - drag.current.dy),
    });
  }
  function onPointerUp(e: React.PointerEvent) {
    drag.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  }

  return (
    <div
      style={{
        left: pos.x,
        top: pos.y,
        width: big ? "min(46rem, 92vw)" : "22rem",
        height: big ? "min(38rem, 80vh)" : "28rem",
      }}
      className="fixed z-40 flex resize flex-col overflow-hidden rounded-lg border border-exam-border bg-white shadow-2xl"
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="flex cursor-grab items-center justify-between border-b border-exam-border bg-exam-chrome px-2 py-1.5 active:cursor-grabbing"
      >
        <span className="text-exam-muted">
          <GripIcon className="h-5 w-5" />
        </span>
        <span className="text-[13px] font-semibold text-exam-ink">Calculator</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setBig((b) => !b)}
            aria-label={big ? "Shrink calculator" : "Expand calculator"}
            className="flex h-7 w-7 items-center justify-center rounded text-exam-muted hover:bg-white hover:text-exam-ink"
          >
            <ExpandIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onClose}
            aria-label="Close calculator"
            className="flex h-7 w-7 items-center justify-center rounded text-exam-muted hover:bg-white hover:text-exam-ink"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
      <iframe
        src="https://www.desmos.com/calculator"
        title="Desmos graphing calculator"
        className="h-full w-full border-0"
      />
    </div>
  );
}
