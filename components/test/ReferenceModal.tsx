"use client";

import { useEffect, useRef, useState } from "react";
import { CloseIcon, ExpandIcon, GripIcon } from "./icons";

// Superscript exponent (r², a², r³ …).
function Sup({ children }: { children: React.ReactNode }) {
  return <sup className="text-[0.62em]">{children}</sup>;
}

// Stacked fraction (½, 4⁄3, 1⁄3 …).
function Frac({ n, d }: { n: string; d: string }) {
  return (
    <span className="mx-0.5 inline-flex flex-col items-center align-middle text-[0.78em] leading-[1.05]">
      <span>{n}</span>
      <span className="my-px w-full border-t border-current" />
      <span>{d}</span>
    </span>
  );
}

// Italic-serif figure label drawn inside an SVG.
function L({
  x,
  y,
  children,
  anchor = "middle",
}: {
  x: number;
  y: number;
  children: React.ReactNode;
  anchor?: "start" | "middle" | "end";
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fontFamily="Georgia, serif"
      fontStyle="italic"
      fontSize="11"
      fill="currentColor"
      stroke="none"
    >
      {children}
    </text>
  );
}

const svgProps = {
  className: "h-16 text-exam-ink",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinejoin: "round" as const,
};

const circle = (
  <svg viewBox="0 0 76 76" {...svgProps}>
    <circle cx="34" cy="38" r="28" />
    <circle cx="34" cy="38" r="2" fill="currentColor" stroke="none" />
    <line x1="34" y1="38" x2="62" y2="38" />
    <L x={47} y={33}>r</L>
  </svg>
);

const rectangle = (
  <svg viewBox="0 0 92 64" {...svgProps}>
    <rect x="14" y="20" width="58" height="30" />
    <L x={43} y={14}>ℓ</L>
    <L x={80} y={39} anchor="start">w</L>
  </svg>
);

const triangle = (
  <svg viewBox="0 0 84 70" {...svgProps}>
    <path d="M46 10 L12 56 L74 56 Z" />
    <line x1="46" y1="10" x2="46" y2="56" strokeDasharray="3 3" />
    <L x={51} y={36} anchor="start">h</L>
    <L x={43} y={68}>b</L>
  </svg>
);

const rightTriangle = (
  <svg viewBox="0 0 84 70" {...svgProps}>
    <path d="M18 12 L18 56 L74 56 Z" />
    <path d="M26 56 L26 48 L18 48" />
    <L x={11} y={36} anchor="end">b</L>
    <L x={46} y={68}>a</L>
    <L x={50} y={30} anchor="start">c</L>
  </svg>
);

const triangle306090 = (
  <svg viewBox="0 0 88 72" {...svgProps}>
    <path d="M54 10 L14 60 L54 60 Z" />
    <path d="M46 60 L46 52 L54 52" />
    <L x={26} y={32} anchor="end">2x</L>
    <L x={49} y={22}>60°</L>
    <L x={58} y={38} anchor="start">x</L>
    <L x={20} y={56}>30°</L>
    <L x={34} y={70}>x√3</L>
  </svg>
);

const triangle454590 = (
  <svg viewBox="0 0 80 72" {...svgProps}>
    <path d="M18 10 L18 58 L62 58 Z" />
    <path d="M18 50 L26 50 L26 58" />
    <L x={11} y={36} anchor="end">s</L>
    <L x={42} y={70}>s</L>
    <L x={44} y={28} anchor="start">s√2</L>
    <L x={24} y={22}>45°</L>
    <L x={50} y={54}>45°</L>
  </svg>
);

const box = (
  <svg viewBox="0 0 94 72" {...svgProps}>
    <path d="M14 30 h44 v30 h-44 z" />
    <path d="M14 30 l16 -13 h44 l-16 13" />
    <path d="M58 30 l16 -13 v30 l-16 13" />
    <L x={84} y={48} anchor="start">h</L>
    <L x={70} y={16}>w</L>
    <L x={34} y={70}>ℓ</L>
  </svg>
);

const cylinder = (
  <svg viewBox="0 0 76 80" {...svgProps}>
    <ellipse cx="34" cy="16" rx="22" ry="7" />
    <path d="M12 16 V62" />
    <path d="M56 16 V62" />
    <path d="M12 62 a22 7 0 0 0 44 0" />
    <line x1="34" y1="16" x2="56" y2="16" />
    <L x={42} y={12}>r</L>
    <L x={60} y={42} anchor="start">h</L>
  </svg>
);

const sphere = (
  <svg viewBox="0 0 72 72" {...svgProps}>
    <circle cx="34" cy="36" r="28" />
    <ellipse cx="34" cy="36" rx="28" ry="9" strokeDasharray="3 3" />
    <line x1="34" y1="36" x2="58" y2="30" />
    <L x={44} y={30} anchor="start">r</L>
  </svg>
);

const cone = (
  <svg viewBox="0 0 76 82" {...svgProps}>
    <path d="M34 10 L12 62" />
    <path d="M34 10 L56 62" />
    <path d="M12 62 a22 7 0 0 0 44 0" />
    <path d="M12 62 a22 7 0 0 1 44 0" strokeDasharray="3 3" />
    <line x1="34" y1="10" x2="34" y2="62" strokeDasharray="3 3" />
    <line x1="34" y1="62" x2="56" y2="62" />
    <L x={38} y={42} anchor="start">h</L>
    <L x={44} y={59} anchor="start">r</L>
  </svg>
);

const pyramid = (
  <svg viewBox="0 0 88 76" {...svgProps}>
    <path d="M16 60 L62 60 L74 48 L28 48 Z" />
    <path d="M44 10 L16 60" />
    <path d="M44 10 L62 60" />
    <path d="M44 10 L74 48" />
    <path d="M44 10 L28 48" strokeDasharray="3 3" />
    <line x1="44" y1="10" x2="46" y2="54" strokeDasharray="3 3" />
    <L x={49} y={36} anchor="start">h</L>
    <L x={36} y={70}>ℓ</L>
    <L x={72} y={60} anchor="start">w</L>
  </svg>
);

function Cell({ figure, children }: { figure: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex h-[84px] items-end justify-center">{figure}</div>
      {children ? (
        <div className="mt-2 text-center font-serif text-[14px] leading-tight text-exam-ink">
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function ReferenceModal({ onClose }: { onClose: () => void }) {
  const [pos, setPos] = useState({ x: 96, y: 64 });
  const [big, setBig] = useState(false);
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

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
      role="dialog"
      aria-modal="false"
      aria-label="Reference Sheet"
      style={{
        left: pos.x,
        top: pos.y,
        width: big ? "min(52rem, 96vw)" : "min(40rem, 94vw)",
        maxHeight: "86vh",
      }}
      className="fixed z-50 flex flex-col overflow-hidden rounded-xl border border-exam-border bg-white shadow-2xl"
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        className="flex cursor-grab items-center gap-2 bg-exam-ink px-4 py-2.5 text-white active:cursor-grabbing"
      >
        <span className="flex-1 text-[15px] font-semibold">Reference Sheet</span>
        <GripIcon className="h-5 w-5 opacity-80" />
        <div className="flex flex-1 items-center justify-end gap-1">
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setBig((b) => !b)}
            aria-label={big ? "Shrink reference sheet" : "Expand reference sheet"}
            className="flex h-7 w-7 items-center justify-center rounded text-white/80 hover:bg-white/10 hover:text-white"
          >
            <ExpandIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onClose}
            aria-label="Close reference sheet"
            className="flex h-7 w-7 items-center justify-center rounded text-white/80 hover:bg-white/10 hover:text-white"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="overflow-y-auto px-6 py-6">
        <div className="grid grid-cols-4 gap-x-3 gap-y-6">
          <Cell figure={circle}>
            <div className="flex flex-col items-center leading-snug">
              <span>
                <i>A</i> = π<i>r</i>
                <Sup>2</Sup>
              </span>
              <span>
                <i>C</i> = 2π<i>r</i>
              </span>
            </div>
          </Cell>
          <Cell figure={rectangle}>
            <span>
              <i>A</i> = ℓ<i>w</i>
            </span>
          </Cell>
          <Cell figure={triangle}>
            <span>
              <i>A</i> = <Frac n="1" d="2" />
              <i>bh</i>
            </span>
          </Cell>
          <Cell figure={rightTriangle}>
            <span>
              <i>c</i>
              <Sup>2</Sup> = <i>a</i>
              <Sup>2</Sup> + <i>b</i>
              <Sup>2</Sup>
            </span>
          </Cell>

          <Cell figure={triangle306090} />
          <Cell figure={triangle454590} />
          <Cell figure={box}>
            <span>
              <i>V</i> = ℓ<i>wh</i>
            </span>
          </Cell>
          <Cell figure={cylinder}>
            <span>
              <i>V</i> = π<i>r</i>
              <Sup>2</Sup>
              <i>h</i>
            </span>
          </Cell>

          <div className="col-span-2 -mt-3 text-center font-serif text-[14px] font-semibold text-exam-ink">
            Special Right Triangles
          </div>
          <div className="col-span-2" />

          <Cell figure={sphere}>
            <span>
              <i>V</i> = <Frac n="4" d="3" />π<i>r</i>
              <Sup>3</Sup>
            </span>
          </Cell>
          <Cell figure={cone}>
            <span>
              <i>V</i> = <Frac n="1" d="3" />π<i>r</i>
              <Sup>2</Sup>
              <i>h</i>
            </span>
          </Cell>
          <Cell figure={pyramid}>
            <span>
              <i>V</i> = <Frac n="1" d="3" />ℓ<i>wh</i>
            </span>
          </Cell>
          <div />
        </div>

        <div className="mt-7 space-y-3 font-serif text-[15px] leading-7 text-exam-ink">
          <p>The number of degrees of arc in a circle is 360.</p>
          <p>The number of radians of arc in a circle is 2π.</p>
          <p>The sum of the measures in degrees of the angles of a triangle is 180.</p>
        </div>
      </div>
    </div>
  );
}
