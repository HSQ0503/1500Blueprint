"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Avatar } from "./Avatar";
import { AvatarCropper } from "./AvatarCropper";

type Props = {
  name: string;
  initials: string;
  level: number;
  plan: string;
  avatarUrl: string | null;
};

// The nav avatar: clicking it opens a small menu with profile-photo controls and
// the sign-out action (a plain form POST to the logout route).
export function AccountMenu({ name, initials, level, plan, avatarUrl }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function onPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file after a remove
    if (!file) return;
    setError(null);
    setOpen(false); // hand off to the cropper modal
    setPending(file);
  }

  async function uploadBlob(blob: Blob) {
    setBusy(true);
    setError(null);
    const body = new FormData();
    body.append("file", blob, "avatar.jpg");
    const res = await fetch("/api/profile/avatar", { method: "POST", body });
    setBusy(false);
    if (!res.ok) {
      setError("Upload failed. Use an image under 5 MB.");
      return; // keep the cropper open so they can retry
    }
    setPending(null);
    router.refresh();
  }

  async function removePhoto() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/profile/avatar", { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      setError("Could not remove. Please try again.");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="inline-flex h-[34px] w-[34px] items-center justify-center overflow-hidden rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(11,42,91,0.15)]"
      >
        <Avatar src={avatarUrl} initials={initials} alt={name} className="h-full w-full text-[13px]" />
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
            className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border border-navy/12 bg-white shadow-xl"
          >
            <div className="flex items-center gap-3 border-b border-navy/10 px-4 py-3">
              <Avatar src={avatarUrl} initials={initials} alt={name} className="h-9 w-9 flex-none text-xs" />
              <div className="min-w-0">
                <div className="truncate text-sm font-bold text-navy">{name}</div>
                <div className="mt-0.5 text-xs text-navy/50">
                  Level {level} · {plan}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-navy/70 transition-colors hover:bg-navy/5 hover:text-navy disabled:opacity-50"
            >
              {busy ? "Working…" : avatarUrl ? "Change photo" : "Add photo"}
            </button>
            {avatarUrl && !busy && (
              <button
                type="button"
                onClick={removePhoto}
                className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-navy/70 transition-colors hover:bg-navy/5 hover:text-navy"
              >
                Remove photo
              </button>
            )}
            {error && <p className="px-4 py-2 text-xs font-medium text-danger-600">{error}</p>}
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp"
              onChange={onPick}
              className="hidden"
            />

            <form action="/api/auth/logout" method="post" className="border-t border-navy/10">
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

      {pending && (
        <AvatarCropper
          file={pending}
          busy={busy}
          error={error}
          onCancel={() => {
            setPending(null);
            setError(null);
          }}
          onSave={uploadBlob}
        />
      )}
    </div>
  );
}
