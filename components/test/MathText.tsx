import katex from "katex";
import { Fragment, type ReactNode } from "react";

// Renders question text with inline LaTeX. Math between $...$ is typeset with
// KaTeX (print-quality, synchronous); everything else is plain text. Drop-in
// superset of the previous caret-only renderer: same { children: string } prop
// and same fast path when there is no math.
//
// Legacy fallback: some imported practice-test content writes exponents with a
// bare caret ("a^x", "x^(3/2)") WITHOUT $...$ delimiters. Those plain-text
// segments still render the caret form as a real <sup>. Inside $...$, KaTeX
// handles exponents itself, so the fallback only touches non-math text.

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
    out.push(<sup key={`sup-${key++}`}>{inner}</sup>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function renderPlain(text: string, key: number): ReactNode {
  if (!text.includes("^")) return <Fragment key={key}>{text}</Fragment>;
  return <Fragment key={key}>{renderExponents(text)}</Fragment>;
}

export function MathText({ children }: { children: string }) {
  if (!children.includes("$")) return renderPlain(children, 0);

  // Split on $...$ keeping the delimiters (capturing group). Segments wrapped in
  // $ are math; everything else is plain text. Using split() avoids mutating a
  // shared regex's lastIndex inside render.
  const segments = children.split(/(\$[^$]+\$)/);
  return (
    <Fragment>
      {segments.map((seg, i) => {
        if (seg.length >= 2 && seg.startsWith("$") && seg.endsWith("$")) {
          return (
            <span
              key={`math-${i}`}
              // KaTeX output is safe, sanitized HTML. throwOnError:false degrades
              // a malformed expression to its raw source instead of crashing.
              dangerouslySetInnerHTML={{
                __html: katex.renderToString(seg.slice(1, -1), { throwOnError: false }),
              }}
            />
          );
        }
        return renderPlain(seg, i);
      })}
    </Fragment>
  );
}
