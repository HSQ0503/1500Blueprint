"use client";

import { useId, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { label } from "@/components/drills/shared/ui";

const MAX_BYTES = 4 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
const ACCEPT = ACCEPTED_TYPES.join(",");

type FigureUploadFieldProps = {
  value: string;
  onChange: (value: string) => void;
  labelText?: string;
};

type UploadResponse = {
  url?: unknown;
  error?: unknown;
};

function UploadIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <path d="M4 16.5V19a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2.5" strokeLinecap="round" />
      <path d="M12 15V4m0 0L8.5 7.5M12 4l3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return "Use a PNG, JPG, GIF, or WebP image.";
  if (file.size === 0) return "That image is empty. Choose a different file.";
  if (file.size > MAX_BYTES) return "That image is over 4 MB. Choose a smaller file.";
  return null;
}

function uploadError(response: Response, data: UploadResponse | null): string {
  if (response.status === 403) return "Your admin session expired. Sign in again, then retry.";
  if (data?.error === "unsupported_type") return "Use a PNG, JPG, GIF, or WebP image.";
  if (data?.error === "too_large" || response.status === 413) return "That image is over 4 MB. Choose a smaller file.";
  return "The image could not be uploaded. Please try again.";
}

export function FigureUploadField({
  value,
  onChange,
  labelText = "Figure (optional)",
}: FigureUploadFieldProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  async function upload(file: File) {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setStatus(null);
      return;
    }

    setUploading(true);
    setError(null);
    setStatus(null);
    const body = new FormData();
    body.append("file", file);

    try {
      const response = await fetch("/admin/api/figures/upload", { method: "POST", body });
      const data = (await response.json().catch(() => null)) as UploadResponse | null;
      if (!response.ok || typeof data?.url !== "string") {
        setError(uploadError(response, data));
        return;
      }

      onChange(data.url);
      setStatus("Image uploaded. Save your changes to attach it to this question.");
    } catch {
      setError("The image could not be uploaded. Check your connection and retry.");
    } finally {
      setUploading(false);
    }
  }

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (file) void upload(file);
  }

  function dropFile(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file && !uploading) void upload(file);
  }

  function clearFigure() {
    onChange("");
    setError(null);
    setStatus("Figure removed. Save your changes to confirm.");
  }

  return (
    <div>
      <span className={`${label} mb-1.5 block text-navy/55`}>{labelText}</span>
      <div
        onDrop={dropFile}
        onDragOver={(event) => {
          event.preventDefault();
          if (!uploading) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        className={`rounded-[10px] border-[1.5px] border-dashed p-3 transition-colors sm:p-4 ${
          dragging ? "border-brand bg-brand/[0.06]" : "border-navy/[0.18] bg-mist/35"
        }`}
      >
        {value ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex min-h-28 flex-1 items-center justify-center overflow-hidden rounded-lg border border-navy/10 bg-white p-2">
              {/* A native image supports both uploaded and manually pasted remote URLs. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt="Question figure preview"
                loading="lazy"
                className="max-h-40 max-w-full object-contain"
              />
            </div>
            <div className="flex gap-2 sm:flex-col">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-bold text-white transition-colors hover:bg-brand/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
              >
                <UploadIcon className="h-4 w-4" />
                {uploading ? "Uploading…" : "Replace"}
              </button>
              <button
                type="button"
                onClick={clearFigure}
                disabled={uploading}
                className="inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-navy/15 bg-white px-4 text-sm font-semibold text-navy transition-colors hover:border-danger/30 hover:bg-danger-bg hover:text-danger-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:opacity-50"
              >
                <CloseIcon />
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="flex min-h-28 flex-col items-center justify-center px-3 py-2 text-center">
            <span className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand">
              <UploadIcon className="h-5 w-5" />
            </span>
            <div className="flex flex-wrap items-center justify-center gap-x-1.5 text-sm text-navy/55">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="min-h-11 cursor-pointer rounded-md px-1 font-bold text-brand underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-wait disabled:opacity-60"
              >
                {uploading ? "Uploading image…" : "Choose an image"}
              </button>
              <span>or drag and drop</span>
            </div>
            <span className="text-[12px] text-navy/40">PNG, JPG, GIF, or WebP · up to 4 MB</span>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        id={`${inputId}-file`}
        type="file"
        accept={ACCEPT}
        onChange={chooseFile}
        disabled={uploading}
        className="hidden"
        aria-label="Upload question figure"
      />

      <label htmlFor={`${inputId}-url`} className="mt-3 block text-[12px] font-semibold text-navy/55">
        Or paste an image URL
      </label>
      <input
        id={`${inputId}-url`}
        type="url"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setError(null);
          setStatus(null);
        }}
        placeholder="https://…/figures/…"
        className="mt-1 w-full rounded-[10px] border-[1.5px] border-navy/[0.18] bg-white px-[13px] py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-navy/35 focus:border-brand focus:ring-2 focus:ring-brand/15"
      />
      <span className="mt-1 block text-[12px] leading-snug text-navy/45">
        Shown with the question. Uploading stores a public copy in Supabase Storage.
      </span>

      {error ? (
        <p role="alert" className="mt-2 text-[12px] font-semibold text-danger-600">
          {error}
        </p>
      ) : null}
      <div aria-live="polite">
        {status ? <p className="mt-2 text-[12px] font-medium text-navy/55">{status}</p> : null}
      </div>
    </div>
  );
}
