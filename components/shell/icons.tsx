// Small glyphs shared across the gamified platform shell (nav, hub, drill runner).
type IconProps = { className?: string };

// Filled flame — always the brand gold/amber pairing; used for streak counters.
export function FlameIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 3s5 3.5 5 8.5a5 5 0 0 1-10 0c0-1.6.6-2.8 1.3-3.6.2 1.2.9 1.9 1.7 2.1C9.4 7.8 12 6.3 12 3z"
        fill="#ffbd20"
        stroke="#f0a900"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Lightning bolt — XP marker (currentColor fill).
export function ZapIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M13 2 4.5 13H11l-1 9 8.5-11H12l1-9z" />
    </svg>
  );
}

// Solid play triangle — drill "Start" buttons.
export function PlayIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M8 5.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 8 5.5z" />
    </svg>
  );
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M7 4l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
