// Inline SVG icons for the drills suite (no emojis). Each inherits currentColor.
import type { DrillIconName } from "@/lib/drills/registry";

type IconProps = { className?: string };

// --- Drill card glyphs ---

export function GrammarGlyph({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6 3.5h8l4 4V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M13.5 3.5V8h4M8.5 12.5h7M8.5 16h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TargetGlyph({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="4.6" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" />
    </svg>
  );
}

export function ReadingGlyph({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 6.5C10.5 5.2 8.3 4.8 5.5 5.2A1 1 0 0 0 4.7 6.2v11a1 1 0 0 0 1.1 1c2.6-.3 4.7 0 6.2 1.3 1.5-1.3 3.6-1.6 6.2-1.3a1 1 0 0 0 1.1-1v-11a1 1 0 0 0-.8-1C15.7 4.8 13.5 5.2 12 6.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M12 6.5V19" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function ScanGlyph({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="11" cy="11" r="3.2" stroke="currentColor" strokeWidth="1.7" />
      <path d="m14 14 2.2 2.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function VocabGlyph({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M5 5.5A1.5 1.5 0 0 1 6.5 4H18a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H6.5A1.5 1.5 0 0 0 5 20.5V5.5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M9 9h6M9 12.5h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function FlashcardsGlyph({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="m12 3.5 8 4-8 4-8-4 8-4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="m4.5 12 7.5 3.75L19.5 12M4.5 16l7.5 3.75L19.5 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AiMathGlyph({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 3.5c.6 3.3 1.7 4.4 5 5-3.3.6-4.4 1.7-5 5-.6-3.3-1.7-4.4-5-5 3.3-.6 4.4-1.7 5-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M18.5 14.5c.3 1.5.8 2 2.3 2.3-1.5.3-2 .8-2.3 2.3-.3-1.5-.8-2-2.3-2.3 1.5-.3 2-.8 2.3-2.3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

const GLYPHS = {
  grammar: GrammarGlyph,
  target: TargetGlyph,
  reading: ReadingGlyph,
  scan: ScanGlyph,
  vocab: VocabGlyph,
  flashcards: FlashcardsGlyph,
  aimath: AiMathGlyph,
};

export function DrillGlyph({ name, className }: { name: DrillIconName; className?: string }) {
  const Glyph = GLYPHS[name];
  return <Glyph className={className} />;
}

// --- HUD + control icons ---

export function HeartIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 20.5 4.6 13a4.6 4.6 0 0 1 6.5-6.5l.9.9.9-.9A4.6 4.6 0 0 1 19.4 13L12 20.5z" />
    </svg>
  );
}

export function HeartOutlineIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 20.5 4.6 13a4.6 4.6 0 0 1 6.5-6.5l.9.9.9-.9A4.6 4.6 0 0 1 19.4 13L12 20.5z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

export function MicIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M6 11a6 6 0 0 0 12 0M12 17v3.5M9.5 20.5h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function SendIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M20 4 3.5 11.2a.5.5 0 0 0 0 .9l6.2 2.2 2.2 6.2a.5.5 0 0 0 .9 0L20 4z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M20 4 9.7 14.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function FlameIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 3s5 3.5 5 8.5a5 5 0 0 1-10 0c0-1.6.6-2.8 1.3-3.6.2 1.2.9 1.9 1.7 2.1C9.4 7.8 12 6.3 12 3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export function BoltIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M13 2 4.5 13H11l-1 9 8.5-11H12l1-9z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function TrophyIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M7 6H4.5v1.5A2.5 2.5 0 0 0 7 10M17 6h2.5v1.5A2.5 2.5 0 0 1 17 10M9.5 14.5 9 18h6l-.5-3.5M8 20h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TrendIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M4 15.5 9 10l3.5 3.5L20 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15.5 6H20v4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function XCircleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path d="m9 9 6 6M15 9l-6 6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function CheckCircleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path d="m8 12.5 2.5 2.5L16 9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PlayIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M8 5.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 8 5.5z" />
    </svg>
  );
}

export function HistoryIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M6 20V11M12 20V5M18 20v-6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

export function SlidersIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M5 8h8M17 8h2M5 16h2M11 16h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="15" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="9" cy="16" r="2.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function SparkIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 3c.5 3.6 1.9 5 5.5 5.5-3.6.5-5 1.9-5.5 5.5-.5-3.6-1.9-5-5.5-5.5C10.1 8 11.5 6.6 12 3z" />
    </svg>
  );
}
