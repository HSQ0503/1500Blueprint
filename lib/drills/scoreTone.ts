export type ScoreTone = "success" | "warning" | "danger";

export function scoreToneFor(score: number, successThreshold = 100): ScoreTone {
  if (score >= successThreshold) return "success";
  if (score >= 50) return "warning";
  return "danger";
}
