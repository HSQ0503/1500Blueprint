"use client";

import { useEffect } from "react";
import { CloseIcon } from "./icons";

type Props = {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

export function Modal({ title, onClose, children }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/40"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-exam-line px-5 py-3">
          <h2 className="font-display text-lg font-bold text-exam-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-exam-muted hover:bg-exam-line/50 hover:text-exam-ink"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 text-[15px] leading-7 text-exam-ink">
          {children}
        </div>
      </div>
    </div>
  );
}
