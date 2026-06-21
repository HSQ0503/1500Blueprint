import type { GridInExample } from "./mockData";
import { GRID_IN_EXAMPLES } from "./mockData";
import { label } from "../shared/ui";

// Left pane: the College Board "Student-produced response directions" with the
// grid-in rules, then a ruled, serif "Examples" table. Restyled into the
// academic system (hairline borders, uppercase tracked header, serif content).

function Fraction({ num, den }: { num: string; den: string }) {
  return (
    <span className="inline-flex flex-col items-center leading-none align-middle">
      <span className="px-1 pb-0.5">{num}</span>
      <span className="w-full border-t border-exam-ink px-1 pt-0.5">{den}</span>
    </span>
  );
}

function AnswerCell({ answer }: { answer: GridInExample["answer"] }) {
  if (answer.den) {
    return (
      <span className="inline-flex items-center gap-0.5 font-serif text-[15px] text-exam-ink">
        {answer.negative ? <span>&minus;</span> : null}
        <Fraction num={answer.num} den={answer.den} />
      </span>
    );
  }
  return <span className="font-serif text-[15px] text-exam-ink">{answer.num}</span>;
}

const RULES: { lead: string; rest: string }[] = [
  { lead: "more than one correct answer", rest: ", enter only one answer." },
  {
    lead: "",
    rest:
      "You can enter up to 5 characters for a positive answer and up to 6 characters (including the negative sign) for a negative answer.",
  },
  {
    lead: "fraction",
    rest: " that doesn't fit in the provided space, enter the decimal equivalent.",
  },
  {
    lead: "decimal",
    rest: " that doesn't fit, enter it by truncating or rounding at the fourth digit.",
  },
  {
    lead: "mixed number",
    rest:
      " (such as 3 1/2), enter it as an improper fraction (7/2) or its decimal equivalent (3.5).",
  },
  {
    lead: "symbols",
    rest: " such as a percent sign, comma, or dollar sign.",
  },
];

export function DirectionsPanel() {
  return (
    <div>
      <h2 className="font-serif text-lg font-bold text-exam-ink">
        Student-produced response directions
      </h2>

      <ul className="mt-4 space-y-2.5 font-serif text-[15px] leading-relaxed text-exam-ink">
        <li className="flex gap-2.5">
          <Bullet />
          <span>
            If you find <strong className="font-semibold">more than one correct answer</strong>,
            enter only one answer.
          </span>
        </li>
        <li className="flex gap-2.5">
          <Bullet />
          <span>
            You can enter up to 5 characters for a{" "}
            <strong className="font-semibold">positive</strong> answer and up to 6 characters
            (including the negative sign) for a <strong className="font-semibold">negative</strong>{" "}
            answer.
          </span>
        </li>
        <li className="flex gap-2.5">
          <Bullet />
          <span>
            If your answer is a <strong className="font-semibold">fraction</strong>{" "}
            that doesn&apos;t fit in the provided space, enter the decimal equivalent.
          </span>
        </li>
        <li className="flex gap-2.5">
          <Bullet />
          <span>
            If your answer is a <strong className="font-semibold">decimal</strong>{" "}
            that doesn&apos;t fit, enter it by truncating or rounding at the fourth digit.
          </span>
        </li>
        <li className="flex gap-2.5">
          <Bullet />
          <span>
            If your answer is a <strong className="font-semibold">mixed number</strong> (such as 3
            1/2), enter it as an improper fraction (7/2) or its decimal equivalent (3.5).
          </span>
        </li>
        <li className="flex gap-2.5">
          <Bullet />
          <span>
            Don&apos;t enter <strong className="font-semibold">symbols</strong> such as a percent sign,
            comma, or dollar sign.
          </span>
        </li>
      </ul>

      <p className="mt-7 text-center font-serif text-base font-semibold text-exam-ink">Examples</p>

      <div className="mt-3 overflow-x-auto rounded-card border border-navy/20">
        <table className="w-full min-w-[440px] border-collapse text-center">
          <thead>
            <tr className="bg-paper/60">
              <th className={`${label} border-b border-navy/20 px-3 py-2.5 text-navy/70`}>Answer</th>
              <th
                className={`${label} border-b border-l border-navy/20 px-3 py-2.5 text-navy/70`}
              >
                Acceptable ways to enter answer
              </th>
              <th
                className={`${label} border-b border-l border-navy/20 px-3 py-2.5 text-navy/70`}
              >
                Unacceptable; will NOT receive credit
              </th>
            </tr>
          </thead>
          <tbody>
            {GRID_IN_EXAMPLES.map((ex, i) => (
              <tr key={i} className={i > 0 ? "border-t border-navy/15" : undefined}>
                <td className="px-3 py-4 align-middle">
                  <AnswerCell answer={ex.answer} />
                </td>
                <td className="border-l border-navy/15 px-3 py-4 align-middle">
                  <div className="space-y-1 font-serif text-[15px] tabular-nums text-exam-ink">
                    {ex.acceptable.map((v) => (
                      <div key={v}>{v}</div>
                    ))}
                  </div>
                </td>
                <td className="border-l border-navy/15 px-3 py-4 align-middle">
                  <div className="space-y-1 font-serif text-[15px] tabular-nums text-exam-muted">
                    {ex.unacceptable.map((v) => (
                      <div key={v}>{v}</div>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Bullet() {
  return <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-navy/40" />;
}

// Re-export so the runner can keep imports tidy if needed.
export { RULES };
