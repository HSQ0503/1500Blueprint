"use client";

import { useState } from "react";

// The community avatar atom: a member's uploaded photo when set, otherwise their
// initials on the brand gradient. Falls back to initials if the image fails to
// load, so a broken or deleted URL never shows a broken-image icon. Sized by a
// numeric `size` (px) since call sites use a range of sizes (26–42).
export function Avatar({
  initials,
  size = 40,
  src,
  alt = "",
}: {
  initials: string;
  size?: number;
  src?: string | null;
  alt?: string;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <span
      className="inline-flex flex-none items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(135deg,#3fa9f5,#0b2a5b)] font-display font-extrabold text-white"
      style={{ height: size, width: size, fontSize: Math.round(size * 0.36) }}
      aria-hidden={showImage ? undefined : true}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src as string}
          alt={alt}
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        initials
      )}
    </span>
  );
}
