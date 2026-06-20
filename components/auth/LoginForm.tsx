"use client";

import { useState, type FormEvent } from "react";

type Status = "idle" | "sending" | "sent" | "error";

export function LoginForm({ initialError }: { initialError?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState(errorMessage(initialError));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setMessage("");
    try {
      const res = await fetch("/api/auth/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(data?.message ?? "Something went wrong. Try again.");
        return;
      }
      if (data?.redirect) {
        window.location.href = data.redirect;
        return;
      }
      setStatus("sent");
      setMessage(data?.message ?? "Check your inbox for a login link.");
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  if (status === "sent") {
    return (
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold text-white">Check your inbox</h1>
        <p className="mt-3 text-sm leading-6 text-white/70">{message}</p>
        <button
          onClick={() => {
            setStatus("idle");
            setMessage("");
          }}
          className="mt-6 text-sm font-medium text-sky hover:text-white"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="w-full">
      <h1 className="font-display text-2xl font-bold text-white">Sign in</h1>
      <p className="mt-2 text-sm leading-6 text-white/70">
        Enter the email on your 1500 membership and we&rsquo;ll send you a login link.
      </p>

      <label htmlFor="email" className="sr-only">
        Email
      </label>
      <input
        id="email"
        type="email"
        required
        autoFocus
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="mt-6 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-brand"
      />

      <button
        type="submit"
        disabled={status === "sending"}
        className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-full bg-gold px-8 text-base font-semibold text-navy shadow-lg shadow-gold/20 transition-colors hover:bg-gold-600 disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Send me a login link"}
      </button>

      {message && (
        <p className={`mt-4 text-sm ${status === "error" ? "text-gold" : "text-white/70"}`}>
          {message}
        </p>
      )}
    </form>
  );
}

function errorMessage(code?: string): string {
  if (code === "expired") {
    return "That link expired or was already used. Enter your email for a fresh one.";
  }
  if (code === "invalid") return "That link wasn't valid. Enter your email to try again.";
  return "";
}
