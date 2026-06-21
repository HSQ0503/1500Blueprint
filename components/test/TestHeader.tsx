"use client";

import { useState } from "react";
import { formatTime } from "@/lib/sat/testState";
import {
  AssistiveIcon,
  CalculatorIcon,
  ChevronDownIcon,
  ClockIcon,
  HelpIcon,
  HighlightsIcon,
  KeyboardIcon,
  LineReaderIcon,
  MoreIcon,
  ReferenceIcon,
  SaveExitIcon,
} from "./icons";

type Props = {
  moduleLabel: string;
  isMath: boolean;
  timeLeft: number;
  timerHidden: boolean;
  warning: boolean;
  highlightEnabled: boolean;
  onToggleTimer: () => void;
  onToggleHighlights: () => void;
  onOpenDirections: () => void;
  onOpenReference: () => void;
  onOpenCalculator: () => void;
  onOpenLineReader: () => void;
  onExit: () => void;
};

export function TestHeader(props: Props) {
  const {
    moduleLabel,
    isMath,
    timeLeft,
    timerHidden,
    warning,
    highlightEnabled,
    onToggleTimer,
    onToggleHighlights,
    onOpenDirections,
    onOpenReference,
    onOpenCalculator,
    onOpenLineReader,
    onExit,
  } = props;
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="font-exam-sans">
      <header className="flex items-stretch justify-between gap-2 bg-exam-chrome px-3 py-2 sm:gap-4 sm:px-5 sm:py-2.5">
        {/* Left: module + directions */}
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <span className="truncate text-[15px] font-semibold leading-tight text-exam-ink sm:text-[18px]">
            {moduleLabel}
          </span>
          <button
            type="button"
            onClick={onOpenDirections}
            className="mt-0.5 flex items-center gap-1 self-start text-[13px] text-exam-ink hover:text-exam-blue"
          >
            Directions
            <ChevronDownIcon className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Center: timer */}
        <div className="flex flex-col items-center justify-center">
          {timerHidden ? (
            <button
              type="button"
              onClick={onToggleTimer}
              className="flex items-center gap-1.5 rounded-full border border-exam-ink/30 bg-white px-3 py-1 text-[13px] text-exam-ink hover:bg-exam-chrome"
            >
              <ClockIcon className="h-4 w-4" />
              Show
            </button>
          ) : (
            <>
              <span
                className={`text-[18px] font-semibold leading-none tabular-nums sm:text-[22px] ${
                  warning ? "text-exam-maroon" : "text-exam-ink"
                }`}
              >
                {formatTime(timeLeft)}
              </span>
              <button
                type="button"
                onClick={onToggleTimer}
                className="mt-1 rounded-full border border-exam-ink/30 bg-white px-3 py-0.5 text-[12px] text-exam-ink hover:bg-exam-chrome"
              >
                Hide
              </button>
            </>
          )}
        </div>

        {/* Right: tools */}
        <div className="flex flex-1 items-center justify-end gap-1">
          {isMath ? (
            <>
              <Tool icon={<CalculatorIcon className="h-6 w-6" />} label="Calculator" onClick={onOpenCalculator} />
              <Tool icon={<ReferenceIcon className="h-7 w-7" />} label="Reference" onClick={onOpenReference} />
            </>
          ) : (
            <Tool
              icon={<HighlightsIcon className="h-6 w-6" />}
              label="Highlights & Notes"
              onClick={onToggleHighlights}
              active={highlightEnabled}
            />
          )}

          <div className="relative">
            <Tool
              icon={<MoreIcon className="h-6 w-6" />}
              label="More"
              onClick={() => setMenuOpen((o) => !o)}
              active={menuOpen}
            />
            {menuOpen && (
              <>
                <button
                  type="button"
                  aria-hidden
                  tabIndex={-1}
                  onClick={() => setMenuOpen(false)}
                  className="fixed inset-0 z-30 cursor-default"
                />
                <div className="absolute right-0 top-full z-40 mt-1 w-60 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-lg border border-exam-border bg-white py-1 shadow-xl">
                  <MenuItem icon={<HelpIcon className="h-5 w-5" />} onClick={() => setMenuOpen(false)}>
                    Help
                  </MenuItem>
                  <MenuItem icon={<KeyboardIcon className="h-5 w-5" />} onClick={() => setMenuOpen(false)}>
                    Shortcuts
                  </MenuItem>
                  <MenuItem icon={<AssistiveIcon className="h-5 w-5" />} onClick={() => setMenuOpen(false)}>
                    Assistive Technology
                  </MenuItem>
                  <MenuItem
                    icon={<LineReaderIcon className="h-5 w-5" />}
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenLineReader();
                    }}
                  >
                    Line Reader
                  </MenuItem>
                  <MenuItem
                    icon={<SaveExitIcon className="h-5 w-5" />}
                    onClick={() => {
                      setMenuOpen(false);
                      onExit();
                    }}
                  >
                    Save and Exit
                  </MenuItem>
                </div>
              </>
            )}
          </div>
        </div>
      </header>
      <div className="bb-perf" />
    </div>
  );
}

function Tool({
  icon,
  label,
  onClick,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className="flex w-12 flex-col items-center justify-center gap-0.5 rounded-md px-1 py-1.5 text-exam-ink hover:bg-black/5 sm:w-[88px] sm:py-1"
    >
      {icon}
      <span
        className={`hidden text-center text-[12px] leading-tight sm:block ${
          active ? "font-bold text-exam-blue underline underline-offset-4" : "font-semibold"
        }`}
      >
        {label}
      </span>
    </button>
  );
}

function MenuItem({
  icon,
  onClick,
  children,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[15px] text-exam-ink hover:bg-exam-tint"
    >
      <span className="text-exam-ink">{icon}</span>
      {children}
    </button>
  );
}
