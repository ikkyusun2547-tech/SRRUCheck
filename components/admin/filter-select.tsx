"use client";

import { useEffect, useRef, useState } from "react";

// A native <select>'s open dropdown is rendered by the browser/OS, not by
// our CSS — no border-radius, spacing, or hover states we write can reach
// it, so next to a carefully styled trigger it always looks unfinished.
// This rebuilds the whole control (trigger + option panel) from scratch so
// every pixel of it is ours. Shared across admin pages that need a filter
// dropdown (activities list, missing-students list, etc.).
export function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
  align = "left",
  disabled = false,
  required = false,
  fullWidth = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  align?: "left" | "right";
  disabled?: boolean;
  /** Hides the "clear selection" option — for fields that can't be empty (e.g. a role picker). */
  required?: boolean;
  /** Stretches the trigger to fill its container — for form fields, as opposed to the default compact toolbar chip. */
  fullWidth?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={`relative ${fullWidth ? "w-full" : ""}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm outline-none transition-colors hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent ${
          fullWidth ? "w-full justify-between" : ""
        } ${value ? "font-medium text-brand-purple-600" : "text-foreground/55"} ${open ? "bg-foreground/5" : ""}`}
      >
        {selected?.label ?? placeholder}
        <ChevronDownIcon className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className={`absolute top-[calc(100%+6px)] z-20 min-w-[12rem] rounded-xl border border-foreground/10 bg-surface p-1.5 shadow-lg shadow-black/10 ${
            fullWidth ? "w-full" : ""
          } ${align === "right" ? "right-0" : "left-0"}`}
        >
          {!required && (
            <>
              <DropdownOption
                label={placeholder}
                active={!value}
                muted
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
              />
              <div className="my-1 h-px bg-foreground/8" />
            </>
          )}
          {options.map((o) => (
            <DropdownOption
              key={o.value}
              label={o.label}
              active={o.value === value}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DropdownOption({
  label,
  active,
  muted,
  onClick,
}: {
  label: string;
  active: boolean;
  muted?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
        active
          ? "bg-brand-purple-50 font-medium text-brand-purple-600 dark:bg-brand-purple-400/10 dark:text-brand-purple-400"
          : muted
            ? "text-foreground/50 hover:bg-foreground/5"
            : "text-foreground hover:bg-foreground/5"
      }`}
    >
      {label}
      {active && <CheckIcon />}
    </button>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden className={className}>
      <path d="M4 6.5L8 10.5L12 6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
