"use client";

import { formatTime } from "@/lib/sat/testState";

const RULES = [
  "Do not disturb students who are still testing.",
  "Do not exit the app or close your laptop.",
  "Do not access phones, smartwatches, textbooks, notes, or the internet.",
  "Do not eat or drink near any testing device.",
  "Do not discuss the exam with anyone.",
];

export function BreakScreen({
  timeLeft,
  onResume,
  studentName,
}: {
  timeLeft: number;
  onResume: () => void;
  studentName: string;
}) {
  return (
    <main className="relative flex min-h-dvh flex-col bg-[#1c1c1e] font-exam-sans text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-1 grid-cols-2 flex-col items-center gap-12 px-8 py-16 md:grid">
        {/* Left: timer + resume */}
        <div className="flex flex-col items-center">
          <div className="w-64 rounded-md border border-white/30 px-6 py-5 text-center">
            <p className="text-[15px] font-bold">Remaining Break Time:</p>
            <p className="mt-1 text-5xl font-bold tabular-nums">{formatTime(timeLeft)}</p>
          </div>
          <button
            type="button"
            onClick={onResume}
            className="mt-6 rounded-full bg-gold px-6 py-2 text-[14px] font-bold text-black hover:bg-gold-600"
          >
            Resume Testing
          </button>
        </div>

        {/* Right: rules */}
        <div className="max-w-md">
          <h1 className="text-2xl font-bold">Practice Test Break</h1>
          <p className="mt-2 text-[14px] leading-6 text-white/80">
            You can resume this practice test as soon as you&rsquo;re ready to move
            on. On test day, you&rsquo;ll wait until the clock counts down.
          </p>
          <div className="my-5 border-t border-white/20" />
          <h2 className="text-xl font-bold">Take a Break: Do Not Close Your Device</h2>
          <p className="mt-2 text-[14px] leading-6 text-white/80">
            After the break, a <strong>Resume Testing Now</strong> button will
            appear and you&rsquo;ll start the next section.
          </p>
          <p className="mt-4 text-[14px] font-bold">Follow these rules during the break:</p>
          <ol className="mt-2 space-y-2 text-[14px] leading-6 text-white/80">
            {RULES.map((r, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-white/60">{i + 1}.</span>
                <span>{r}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <span className="absolute bottom-5 left-6 text-[15px] font-medium">{studentName}</span>
    </main>
  );
}
