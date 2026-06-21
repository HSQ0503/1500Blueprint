"use client";

import { useRef, useState, type ReactNode } from "react";
import { downloadNodeAsPng } from "@/lib/download-png";
import { secondaryBtn } from "@/components/drills/shared/ui";

// Wraps any preview node and exports it as a PNG. The capture targets the inner
// ref'd div so only the wrapped content (not the button) lands in the image.
export function DownloadPng({
  fileName,
  children,
}: {
  fileName: string;
  children: ReactNode;
}) {
  const captureRef = useRef<HTMLDivElement>(null);
  const [capturing, setCapturing] = useState(false);

  async function handleDownload() {
    if (!captureRef.current || capturing) return;
    setCapturing(true);
    try {
      await downloadNodeAsPng(captureRef.current, fileName);
    } finally {
      setCapturing(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div ref={captureRef}>{children}</div>
      <button
        type="button"
        onClick={handleDownload}
        disabled={capturing}
        className={`${secondaryBtn} self-start`}
      >
        {capturing ? (
          <span className="h-4 w-4 animate-spin-slow rounded-full border-2 border-navy/25 border-t-navy" />
        ) : (
          <DownloadIcon className="h-4 w-4" />
        )}
        {capturing ? "Capturing…" : "Download PNG"}
      </button>
    </div>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
