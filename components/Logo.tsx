// 1500 SAT Blueprint mark — a concentric "radar / bullseye" target ("aim for 1500").
// Original interpretation of the brand mark; swap for Scott's exact asset when supplied.

type LogoProps = { className?: string; withWordmark?: boolean };

export function Logo({ className, withWordmark = true }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <svg
        viewBox="0 0 40 40"
        className="h-8 w-8 shrink-0"
        role="img"
        aria-label="1500 SAT Blueprint"
      >
        <circle cx="20" cy="20" r="18" fill="none" stroke="var(--color-brand)" strokeWidth="3.2" />
        <circle cx="20" cy="20" r="11" fill="none" stroke="var(--color-sky)" strokeWidth="3.2" />
        <circle cx="20" cy="20" r="4" fill="var(--color-brand)" />
      </svg>
      {withWordmark && (
        <span className="font-display font-extrabold leading-none tracking-tight">
          <span className="text-navy">1500</span>{" "}
          <span className="text-brand">SAT</span>{" "}
          <span className="text-navy">Blueprint</span>
        </span>
      )}
    </span>
  );
}
