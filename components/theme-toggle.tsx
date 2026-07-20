"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    if (current === "light" || current === "dark") {
      setTheme(current);
    } else {
      setTheme(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    }
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    window.localStorage.setItem("theme", next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="สลับโหมดสว่าง/มืด"
      className="flex items-center justify-center rounded-full p-1.5 transition-colors hover:bg-white/10"
    >
      {theme === "dark" ? <SunIcon /> : theme === "light" ? <MoonIcon /> : <span className="block h-4 w-4" />}
    </button>
  );
}

// Line icons matching the rest of the UI's icon language (stroke-based,
// currentColor) instead of emoji, which render as a different visual
// style per OS/browser and never quite match a designed interface.
function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M8 1.3V2.7M8 13.3V14.7M14.7 8H13.3M2.7 8H1.3M12.7 3.3L11.7 4.3M4.3 11.7L3.3 12.7M12.7 12.7L11.7 11.7M4.3 4.3L3.3 3.3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M13.8 9.8A6 6 0 0 1 6.2 2.2a6 6 0 1 0 7.6 7.6Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}
