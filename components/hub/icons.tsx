// Per-drill line icons used on the hub catalog cards. Paths match the redesign.
export type DrillIconKey =
  | "grammar"
  | "reading"
  | "scan"
  | "target"
  | "aimath"
  | "vocab"
  | "flashcards";

function glyph(name: DrillIconKey) {
  switch (name) {
    case "grammar":
      return (
        <>
          <path d="M6 3.5h8l4 4V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z" strokeLinejoin="round" />
          <path d="M13.5 3.5V8h4M8.5 12.5h7M8.5 16h5" strokeLinecap="round" />
        </>
      );
    case "reading":
      return (
        <>
          <path
            d="M12 6.5C10.5 5.2 8.3 4.8 5.5 5.2A1 1 0 0 0 4.7 6.2v11a1 1 0 0 0 1.1 1c2.6-.3 4.7 0 6.2 1.3 1.5-1.3 3.6-1.6 6.2-1.3a1 1 0 0 0 1.1-1v-11a1 1 0 0 0-.8-1C15.7 4.8 13.5 5.2 12 6.5z"
            strokeLinejoin="round"
          />
          <path d="M12 6.5V19" />
        </>
      );
    case "scan":
      return (
        <>
          <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" strokeLinecap="round" />
          <circle cx="11" cy="11" r="3.2" />
          <path d="m14 14 2.2 2.2" strokeLinecap="round" />
        </>
      );
    case "target":
      return (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <circle cx="12" cy="12" r="4.6" />
          <circle cx="12" cy="12" r="1.4" fill="currentColor" />
        </>
      );
    case "aimath":
      return <path d="M12 3.5c.6 3.3 1.7 4.4 5 5-3.3.6-4.4 1.7-5 5-.6-3.3-1.7-4.4-5-5 3.3-.6 4.4-1.7 5-5z" strokeLinejoin="round" />;
    case "vocab":
      return (
        <>
          <path d="M5 5.5A1.5 1.5 0 0 1 6.5 4H18a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H6.5A1.5 1.5 0 0 0 5 20.5V5.5z" strokeLinejoin="round" />
          <path d="M9 9h6M9 12.5h4" strokeLinecap="round" />
        </>
      );
    case "flashcards":
      return (
        <>
          <path d="m12 3.5 8 4-8 4-8-4 8-4z" strokeLinejoin="round" />
          <path d="m4.5 12 7.5 3.75L19.5 12M4.5 16l7.5 3.75L19.5 16" strokeLinecap="round" strokeLinejoin="round" />
        </>
      );
  }
}

export function DrillIcon({ name, className }: { name: DrillIconKey; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={name === "aimath" ? 1.6 : 1.7} aria-hidden="true">
      {glyph(name)}
    </svg>
  );
}
