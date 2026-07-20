// Hand-authored line icons for the student nav — same stroke-based,
// currentColor language as the admin sidebar icons so both halves of the
// app read as one system, just a distinct icon set for a distinct nav.
type IconProps = { className?: string };
const base = { width: 18, height: 18, viewBox: "0 0 18 18", fill: "none" as const };

export function HomeIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M2.5 8.2 9 2.8l6.5 5.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 7v7a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M7 15v-4h4v4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <rect x="2.5" y="3.5" width="13" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2.5 7H15.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 1.5V4M12 1.5V4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function QrIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <rect x="2.2" y="2.2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="10.8" y="2.2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="2.2" y="10.8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10.8 10.8H13M14.6 10.8H15.8M10.8 13.4H12M13.4 13.4H15.8M10.8 15.8H15.8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function DocumentIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path
        d="M4 2.5h7l3 3v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-12a1 1 0 0 1 1-1z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M6.5 9H11.5M6.5 12H11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function HistoryIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <circle cx="9" cy="9.5" r="6.2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 6.2V9.5L11.5 11.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 1.7 9 3.3l2.5-1.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BellIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path
        d="M4.5 12.5V8a4.5 4.5 0 0 1 9 0v4.5l1.3 1.8H3.2L4.5 12.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M7.3 16a1.8 1.8 0 0 0 3.4 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function UserIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 16c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function LogoutIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path
        d="M7 15.5H4a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1h3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M11.5 12.5L15 9L11.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 9H6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
