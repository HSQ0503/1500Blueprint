"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

// Minimal typings for the Web Speech API (not in the standard TS DOM lib).
type RecognitionAlt = { transcript: string };
type RecognitionResult = ArrayLike<RecognitionAlt> & { isFinal: boolean };
type RecognitionEvent = { resultIndex: number; results: ArrayLike<RecognitionResult> };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: RecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

function recognitionCtor(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => Recognition;
    webkitSpeechRecognition?: new () => Recognition;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const emptySubscribe = () => () => {};

// Dictation via the Web Speech API. Appends transcribed speech to the current
// `value` through `onChange`. Returns whether the browser supports it and a live
// `recording` flag; `toggle` starts/stops. Requires a secure context (https or
// localhost); best supported in Chrome/Edge/Safari.
export function useDictation(value: string, onChange: (next: string) => void) {
  // Client-only feature detection — no hydration mismatch, no setState-in-effect.
  const supported = useSyncExternalStore(
    emptySubscribe,
    () => recognitionCtor() != null,
    () => false,
  );
  const [recording, setRecording] = useState(false);
  const recRef = useRef<Recognition | null>(null);
  const finalRef = useRef(""); // finalized transcript accumulated this session

  // Stop any in-flight recognition when the input unmounts.
  useEffect(() => () => recRef.current?.stop(), []);

  function start() {
    const Ctor = recognitionCtor();
    if (!Ctor || recRef.current) return;
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = true;

    const base = value ? `${value.replace(/\s+$/, "")} ` : "";
    finalRef.current = "";

    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const transcript = r[0]?.transcript ?? "";
        if (r.isFinal) finalRef.current += transcript;
        else interim += transcript;
      }
      onChange(base + finalRef.current + interim);
    };
    rec.onend = () => {
      recRef.current = null;
      setRecording(false);
    };
    rec.onerror = () => {
      recRef.current = null;
      setRecording(false);
    };

    recRef.current = rec;
    try {
      rec.start();
      setRecording(true);
    } catch {
      recRef.current = null;
      setRecording(false);
    }
  }

  function stop() {
    recRef.current?.stop();
    recRef.current = null;
    setRecording(false);
  }

  function toggle() {
    if (recording) stop();
    else start();
  }

  return { supported, recording, toggle };
}
