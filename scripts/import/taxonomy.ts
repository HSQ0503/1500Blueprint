// SAT domain/skill taxonomy. Breadcrumbs in Scott's docs are inconsistent:
// sometimes 4-part (section – domain – skill – difficulty), sometimes 3-part
// (section – skill – difficulty), sometimes the domain is named loosely.
// These helpers normalize a raw domain string and infer the domain from a skill.

export type Difficulty = "easy" | "medium" | "hard";

export const RW_DOMAINS = [
  "Information and Ideas",
  "Craft and Structure",
  "Expression of Ideas",
  "Standard English Conventions",
] as const;

export const MATH_DOMAINS = [
  "Algebra",
  "Advanced Math",
  "Problem-Solving and Data Analysis",
  "Geometry and Trigonometry",
] as const;

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[–—−]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/[.,]/g, "")
    .trim();

// Loose raw-domain → canonical domain.
const DOMAIN_ALIASES: Record<string, string> = {
  "information and ideas": "Information and Ideas",
  "craft and structure": "Craft and Structure",
  "expression of ideas": "Expression of Ideas",
  "standard english conventions": "Standard English Conventions",
  algebra: "Algebra",
  "advanced math": "Advanced Math",
  "quadratic functions": "Advanced Math",
  "problem solving and data analysis": "Problem-Solving and Data Analysis",
  "problem-solving and data analysis": "Problem-Solving and Data Analysis",
  geometry: "Geometry and Trigonometry",
  trigonometry: "Geometry and Trigonometry",
  "geometry and trigonometry": "Geometry and Trigonometry",
};

// Skill → domain, used when the breadcrumb has no explicit domain.
const SKILL_TO_DOMAIN: Record<string, string> = {
  // Information and Ideas
  "central ideas and details": "Information and Ideas",
  "command of evidence": "Information and Ideas",
  "command of evidence (textual)": "Information and Ideas",
  "command of evidence (quantitative)": "Information and Ideas",
  inferences: "Information and Ideas",
  // Craft and Structure
  "words in context": "Craft and Structure",
  "text structure and purpose": "Craft and Structure",
  "cross-text connections": "Craft and Structure",
  // Expression of Ideas
  "rhetorical synthesis": "Expression of Ideas",
  transitions: "Expression of Ideas",
  // Standard English Conventions
  boundaries: "Standard English Conventions",
  "form structure and sense": "Standard English Conventions",
  // Algebra
  "linear equations in one variable": "Algebra",
  "linear equations in two variables": "Algebra",
  "linear functions": "Algebra",
  "systems of two linear equations in two variables": "Algebra",
  "systems of linear equations": "Algebra",
  "linear inequalities in one or two variables": "Algebra",
  functions: "Algebra",
  // Advanced Math
  "equivalent expressions": "Advanced Math",
  "nonlinear functions": "Advanced Math",
  "nonlinear equations in one variable and systems of equations in two variables":
    "Advanced Math",
  // Problem-Solving and Data Analysis
  "ratios rates proportional relationships and units": "Problem-Solving and Data Analysis",
  percentages: "Problem-Solving and Data Analysis",
  "one-variable data: distributions and measures of center and spread":
    "Problem-Solving and Data Analysis",
  "one-variable data distributions and measures of center and spread":
    "Problem-Solving and Data Analysis",
  "two-variable data: models and scatterplots": "Problem-Solving and Data Analysis",
  "linear models": "Problem-Solving and Data Analysis",
  probability: "Problem-Solving and Data Analysis",
  // Geometry and Trigonometry
  "area and volume": "Geometry and Trigonometry",
  "lines angles and triangles": "Geometry and Trigonometry",
  "right triangles and trigonometry": "Geometry and Trigonometry",
  similarity: "Geometry and Trigonometry",
  circles: "Geometry and Trigonometry",
};

export function canonicalDomain(raw: string): string | null {
  return DOMAIN_ALIASES[norm(raw)] ?? null;
}

export function domainForSkill(skill: string): string | null {
  return SKILL_TO_DOMAIN[norm(skill)] ?? null;
}

export function normalizeDifficulty(raw: string): Difficulty | null {
  const n = norm(raw);
  if (n === "easy" || n === "medium" || n === "hard") return n;
  if (n === "challenge") return "hard"; // Scott's hardest tier maps to "hard"
  return null;
}
