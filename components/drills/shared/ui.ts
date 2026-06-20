// Shared academic style vocabulary for the drills. Centralizing these class
// strings keeps every drill consistent: tight radii, hairline borders instead
// of heavy shadows, ruled dividers, uppercase tracked labels, navy primary
// actions, electric blue reserved for selection/links.

// Surfaces
export const surface = "rounded-card border border-navy/15 bg-white";
export const surfaceRaised =
  "rounded-card border border-navy/15 bg-white shadow-[0_1px_2px_rgba(11,42,91,0.05)]";

// Hairline rule (section dividers)
export const rule = "border-navy/10";

// Uppercase tracked micro-label (eyebrows, section + stat headers)
export const label = "text-[11px] font-semibold uppercase tracking-[0.14em]";
export const labelMuted = `${label} text-navy/45`;

// Buttons (rectangular, low radius, never pills)
export const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-card px-5 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40";
export const primaryBtn = `${btnBase} bg-navy text-white hover:bg-navy-700`;
export const accentBtn = `${btnBase} bg-brand text-white hover:bg-brand-600`;
export const secondaryBtn = `${btnBase} border border-navy/20 bg-white text-navy hover:bg-navy/5`;

// Small squared tag (AI / BETA / difficulty / category)
export const chip =
  "inline-flex items-center gap-1 rounded-chip px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide";
