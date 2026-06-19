"use client";

import { useRef, useState } from "react";
import { CloseIcon } from "./icons";

type DragMode = "move" | "top" | "bottom";

// Bluebook's Line Reader: dims the page except a horizontal reading window
// the student can drag and resize. Dimmed areas stay click-through so the
// test remains usable; only the window band and its controls capture pointers.
export function LineReader({ onClose }: { onClose: () => void }) {
  const [top, setTop] = useState(240);
  const [height, setHeight] = useState(56);
  const drag = useRef<{ mode: DragMode; y: number; top: number; height: number } | null>(null);

  function start(mode: DragMode, e: React.PointerEvent) {
    e.stopPropagation();
    drag.current = { mode, y: e.clientY, top, height };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const dy = e.clientY - d.y;
    if (d.mode === "move") {
      setTop(Math.max(0, Math.min(window.innerHeight - d.height, d.top + dy)));
    } else if (d.mode === "top") {
      const nextHeight = d.height - dy;
      if (nextHeight >= 28) {
        setTop(Math.max(0, d.top + dy));
        setHeight(nextHeight);
      }
    } else {
      setHeight(Math.max(28, d.height + dy));
    }
  }
  function end(e: React.PointerEvent) {
    drag.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  }

  const edge =
    "pointer-events-auto absolute inset-x-0 h-1.5 cursor-ns-resize bg-exam-blue";

  return (
    <div className="pointer-events-none fixed inset-0 z-40" aria-hidden>
      <div className="absolute inset-x-0 top-0 bg-black/45" style={{ height: top }} />
      <div className="absolute inset-x-0 bottom-0 bg-black/45" style={{ top: top + height }} />

      <div
        className="pointer-events-auto absolute inset-x-0 cursor-grab active:cursor-grabbing"
        style={{ top, height }}
        onPointerDown={(e) => start("move", e)}
        onPointerMove={onMove}
        onPointerUp={end}
      >
        <div
          className={`${edge} top-0`}
          onPointerDown={(e) => start("top", e)}
          onPointerMove={onMove}
          onPointerUp={end}
        />
        <div
          className={`${edge} bottom-0`}
          onPointerDown={(e) => start("bottom", e)}
          onPointerMove={onMove}
          onPointerUp={end}
        />
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onClose}
          aria-label="Close line reader"
          className="pointer-events-auto absolute right-5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-exam-ink text-white shadow-md hover:bg-exam-ink/90"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
