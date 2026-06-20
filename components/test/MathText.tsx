import { Fragment, type ReactNode } from "react";

// Source docs write exponents inconsistently: some use real superscript glyphs
// (rendered fine), others use a caret ("a^x", "7x^3", "a^(3/2)", "(20)^(m/410)").
// This renders the caret form as a real <sup>. The exponent is either a
// parenthesized group (whose parens are dropped, e.g. "^(3/2)") or a bare run of
// alphanumerics with an optional leading sign ("^x", "^3", "^-2"). Punctuation
// after the exponent ("x.", "x,") is intentionally left out of the superscript.
const EXPONENT_RE = /\^(\([^)]*\)|[+−-]?[A-Za-z0-9]+)/g;

function renderExponents(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  EXPONENT_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = EXPONENT_RE.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const inner = m[1].startsWith("(") ? m[1].slice(1, -1) : m[1];
    out.push(<sup key={key++}>{inner}</sup>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Render plain question text, typesetting caret-exponents as superscripts. */
export function MathText({ children }: { children: string }) {
  if (!children.includes("^")) return <Fragment>{children}</Fragment>;
  return <Fragment>{renderExponents(children)}</Fragment>;
}
