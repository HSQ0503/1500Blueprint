"use client";

// Social-media text rendering for post + comment bodies: @mentions in brand
// blue and URLs as clickable links, with whitespace preserved. Pure display —
// the DB stores plain text, so this can evolve without touching data.

import { Fragment } from "react";

type Segment =
  | { type: "text"; value: string }
  | { type: "mention"; value: string }
  | { type: "link"; value: string };

// URLs, or @handles at a word boundary (start / whitespace / "(") so emails
// like scott@gmail.com never light up as mentions.
const TOKEN = /(https?:\/\/[^\s<>()]+[^\s<>().,!?:;'"])|(?<=^|[\s(])(@[a-zA-Z0-9._-]*[a-zA-Z0-9])/g;

function tokenize(text: string): Segment[] {
  const segments: Segment[] = [];
  let last = 0;
  for (const match of text.matchAll(TOKEN)) {
    const index = match.index ?? 0;
    if (index > last) segments.push({ type: "text", value: text.slice(last, index) });
    if (match[1]) segments.push({ type: "link", value: match[1] });
    else segments.push({ type: "mention", value: match[2] });
    last = index + match[0].length;
  }
  if (last < text.length) segments.push({ type: "text", value: text.slice(last) });
  return segments;
}

export function RichText({ text, className }: { text: string; className?: string }) {
  return (
    <p className={`whitespace-pre-line ${className ?? ""}`}>
      {tokenize(text).map((seg, i) => {
        if (seg.type === "mention") {
          return (
            <span key={i} className="font-semibold text-brand-600">
              {seg.value}
            </span>
          );
        }
        if (seg.type === "link") {
          return (
            <a
              key={i}
              href={seg.value}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="break-all font-medium text-brand-600 underline-offset-2 hover:underline"
            >
              {seg.value}
            </a>
          );
        }
        return <Fragment key={i}>{seg.value}</Fragment>;
      })}
    </p>
  );
}
