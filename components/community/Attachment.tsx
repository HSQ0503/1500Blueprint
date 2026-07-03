import type { PostShot } from "@/lib/community/types";

// An uploaded screenshot attached to a post. Constrained width + hairline frame
// so it reads as a pasted image (Whop style), not a full-bleed hero. object-contain
// keeps score screenshots fully visible (no cropping the number).
export function Attachment({ shot }: { shot: PostShot }) {
  return (
    <div className="mt-3 max-w-[400px] overflow-hidden rounded-[14px] border border-navy/12 bg-haze">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={shot.url} alt={shot.alt} loading="lazy" className="block max-h-[440px] w-full object-contain" />
    </div>
  );
}
