import { surface } from "./ui";

// The "AI is grading..." interstitial shown between submitting an explanation
// and the feedback screen. Reserves its own card so the layout does not jump.
export function GradingLoader({
  title = "AI is grading your explanation...",
  subtitle = "This may take a few seconds.",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div
      className={`animate-pop-in mx-auto mt-6 flex max-w-md flex-col items-center ${surface} px-8 py-14 text-center`}
    >
      <span className="relative flex h-11 w-11">
        <span className="absolute inset-0 rounded-full border-[3px] border-brand/20" />
        <span className="absolute inset-0 animate-spin rounded-full border-[3px] border-transparent border-t-brand" />
      </span>
      <h2 className="mt-5 font-display text-lg font-bold text-ink">{title}</h2>
      <p className="mt-1.5 text-sm text-navy/55">{subtitle}</p>
    </div>
  );
}
