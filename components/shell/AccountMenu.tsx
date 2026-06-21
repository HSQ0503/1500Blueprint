"use client";

import { useState } from "react";

type Props = { name: string; initials: string; level: number; plan: string };

// The avatar from the redesign, made functional: clicking it opens a small menu
// that still carries the sign-out action (a plain form POST to the logout route).
export function AccountMenu({ name, initials, level, plan }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-full border-2 border-white bg-[linear-gradient(135deg,#3fa9f5,#0b2a5b)] font-display text-[13px] font-extrabold text-white shadow-[0_0_0_1px_rgba(11,42,91,0.15)]"
      >
        {initials}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div
            role="menu"
            className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-navy/12 bg-white shadow-xl"
          >
            <div className="border-b border-navy/10 px-4 py-3">
              <div className="text-sm font-bold text-navy">{name}</div>
              <div className="mt-0.5 text-xs text-navy/50">
                Level {level} · {plan}
              </div>
            </div>
            <form action="/api/auth/logout" method="post">
              <button
                type="submit"
                className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-navy/70 transition-colors hover:bg-navy/5 hover:text-navy"
              >
                Sign out
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
