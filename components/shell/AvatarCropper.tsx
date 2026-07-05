"use client";

import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { accentBtn, secondaryBtn } from "@/components/drills/shared/ui";

const VIEW = 240; // preview viewport size (px)
const OUTPUT = 512; // exported avatar size (px)

type Props = {
  file: File;
  busy?: boolean;
  error?: string | null;
  onCancel: () => void;
  onSave: (blob: Blob) => void;
};

// Circular photo positioner: drag to pan, slider to zoom, then export a square
// JPEG already framed the way the student wants. Because the stored image is
// pre-framed, every <Avatar> just shows it with object-cover — no per-site
// position data to thread anywhere.
export function AvatarCropper({ file, busy = false, error = null, onCancel, onSave }: Props) {
  // Derived (not state) so we never setState inside an effect; the effect below
  // only revokes the URL on cleanup.
  const url = useMemo(() => URL.createObjectURL(file), [file]);
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  // "cover" scale so the image always fills the circle at zoom = 1.
  const base = nat ? Math.max(VIEW / nat.w, VIEW / nat.h) : 1;
  const scaledW = nat ? nat.w * base * zoom : VIEW;
  const scaledH = nat ? nat.h * base * zoom : VIEW;

  // Keep the image covering the viewport (never expose a gap at the edges).
  function clamp(x: number, y: number, sW = scaledW, sH = scaledH) {
    return {
      x: Math.min(0, Math.max(VIEW - sW, x)),
      y: Math.min(0, Math.max(VIEW - sH, y)),
    };
  }

  function onLoad() {
    const img = imgRef.current;
    if (!img) return;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    setNat({ w, h });
    const b = Math.max(VIEW / w, VIEW / h);
    setOffset({ x: (VIEW - w * b) / 2, y: (VIEW - h * b) / 2 }); // centered to start
  }

  function onZoom(next: number) {
    // Zoom around the viewport centre so the framed subject stays put.
    const ratio = next / zoom;
    setZoom(next);
    setOffset((o) => {
      const x = VIEW / 2 - (VIEW / 2 - o.x) * ratio;
      const y = VIEW / 2 - (VIEW / 2 - o.y) * ratio;
      const sW = nat ? nat.w * base * next : VIEW;
      const sH = nat ? nat.h * base * next : VIEW;
      return clamp(x, y, sW, sH);
    });
  }

  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  }
  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!drag.current) return;
    setOffset(clamp(drag.current.ox + (e.clientX - drag.current.x), drag.current.oy + (e.clientY - drag.current.y)));
  }
  function endDrag() {
    drag.current = null;
  }

  function save() {
    const img = imgRef.current;
    if (!img || !nat) return;
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const k = OUTPUT / VIEW; // map the preview framing onto the export
    ctx.drawImage(img, offset.x * k, offset.y * k, scaledW * k, scaledH * k);
    canvas.toBlob(
      (blob) => {
        if (blob) onSave(blob);
      },
      "image/jpeg",
      0.9,
    );
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-navy/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Position your photo"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-xs rounded-2xl border border-navy/12 bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-base font-extrabold text-navy">Position your photo</h2>
        <p className="mt-1 text-xs text-navy/55">Drag to center it, and zoom to fit.</p>

        <div className="mt-4 flex justify-center">
          <div
            className="relative touch-none cursor-grab overflow-hidden rounded-full border border-navy/15 bg-mist active:cursor-grabbing"
            style={{ width: VIEW, height: VIEW }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            {url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                ref={imgRef}
                src={url}
                alt=""
                draggable={false}
                onLoad={onLoad}
                className="pointer-events-none absolute left-0 top-0 max-w-none select-none"
                style={{ width: scaledW, height: scaledH, transform: `translate(${offset.x}px, ${offset.y}px)` }}
              />
            )}
            <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/50" />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2.5 text-navy/40">
          <span className="text-xs font-bold">−</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => onZoom(Number(e.target.value))}
            aria-label="Zoom"
            className="h-1 w-full cursor-pointer accent-brand"
          />
          <span className="text-xs font-bold">+</span>
        </div>

        {error && <p className="mt-3 text-xs font-medium text-danger-600">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className={secondaryBtn}>
            Cancel
          </button>
          <button type="button" onClick={save} disabled={busy} className={accentBtn}>
            {busy ? "Saving…" : "Save photo"}
          </button>
        </div>
      </div>
    </div>
  );
}
