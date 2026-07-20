// Shared icon-block section header used across admin cards (activity form,
// faculties, settings, etc.) to keep the "Premium" visual language consistent.
export function SectionHeading({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-purple-50 text-brand-purple-600 dark:bg-brand-purple-400/10 dark:text-brand-purple-400">
        {icon}
      </span>
      <h2 className="text-sm font-semibold text-foreground/80">{children}</h2>
    </div>
  );
}
