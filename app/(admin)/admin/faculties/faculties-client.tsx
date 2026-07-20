"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { SectionHeading } from "@/components/admin/section-heading";
import { EmptyState } from "@/components/admin/empty-state";

type Major = { id: string; nameTh: string; nameEn: string; facultyId: string };
type Faculty = { id: string; nameTh: string; nameEn: string; majors: Major[] };

const inputClass =
  "w-full rounded-lg border border-foreground/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-purple-600/40";

export function FacultiesClient({ initialFaculties }: { initialFaculties: Faculty[] }) {
  const t = useTranslations("adminFaculties");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [newFacultyTh, setNewFacultyTh] = useState("");
  const [newFacultyEn, setNewFacultyEn] = useState("");
  const [addingMajorFor, setAddingMajorFor] = useState<string | null>(null);
  const [newMajorTh, setNewMajorTh] = useState("");
  const [newMajorEn, setNewMajorEn] = useState("");
  const [pending, setPending] = useState(false);

  const filteredFaculties = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return initialFaculties;
    return initialFaculties.filter(
      (f) => f.nameTh.toLowerCase().includes(q) || f.nameEn.toLowerCase().includes(q)
    );
  }, [initialFaculties, search]);

  async function refresh() {
    router.refresh();
  }

  async function handleAddFaculty(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/admin/faculties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nameTh: newFacultyTh, nameEn: newFacultyEn }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("addFacultyFailed"));
        return;
      }
      setNewFacultyTh("");
      setNewFacultyEn("");
      await refresh();
    } finally {
      setPending(false);
    }
  }

  async function handleDeleteFaculty(id: string) {
    if (!confirm(t("confirmDeleteFaculty"))) return;
    setError(null);
    const res = await fetch(`/api/admin/faculties/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? t("deleteFacultyFailed"));
      return;
    }
    await refresh();
  }

  async function handleAddMajor(e: React.FormEvent, facultyId: string) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/admin/majors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ facultyId, nameTh: newMajorTh, nameEn: newMajorEn }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("addMajorFailed"));
        return;
      }
      setNewMajorTh("");
      setNewMajorEn("");
      setAddingMajorFor(null);
      await refresh();
    } finally {
      setPending(false);
    }
  }

  async function handleDeleteMajor(id: string) {
    if (!confirm(t("confirmDeleteMajor"))) return;
    setError(null);
    const res = await fetch(`/api/admin/majors/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? t("deleteFacultyFailed"));
      return;
    }
    await refresh();
  }

  return (
    <div className="space-y-5">
      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="space-y-3 rounded-xl border border-foreground/10 bg-surface p-5 shadow-sm">
        <SectionHeading icon={<BuildingIcon />}>{t("addFacultyCardTitle")}</SectionHeading>
        <form onSubmit={handleAddFaculty} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[180px] flex-1">
            <label className="mb-1 block text-xs text-foreground/55">{t("facultyNameThLabel")}</label>
            <input required value={newFacultyTh} onChange={(e) => setNewFacultyTh(e.target.value)} className={inputClass} />
          </div>
          <div className="min-w-[180px] flex-1">
            <label className="mb-1 block text-xs text-foreground/55">{t("facultyNameEnLabel")}</label>
            <input required value={newFacultyEn} onChange={(e) => setNewFacultyEn(e.target.value)} className={inputClass} />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-emerald-600 disabled:opacity-60"
          >
            <PlusIcon />
            {t("addFacultyButton")}
          </button>
        </form>
      </div>

      <div className="relative rounded-xl border border-foreground/10 bg-surface p-2 shadow-sm">
        <span className="pointer-events-none absolute inset-y-0 left-5 flex items-center text-foreground/35">
          <SearchIcon />
        </span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full rounded-lg bg-transparent py-2 pl-9 pr-3 text-sm outline-none placeholder:text-foreground/40"
        />
      </div>

      {filteredFaculties.length === 0 ? (
        <EmptyState icon={<BuildingIcon size={22} />} message={tCommon("noResults")} />
      ) : (
        <div className="space-y-4">
          {filteredFaculties.map((f) => {
            const initial = f.nameTh.trim().charAt(0).toUpperCase() || "?";
            return (
              <div key={f.id} className="rounded-xl border border-foreground/10 bg-surface p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple-400 to-brand-emerald-400 text-sm font-bold text-brand-purple-950">
                      {initial}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">{f.nameTh}</p>
                      <p className="truncate text-xs text-foreground/45">{f.nameEn}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setAddingMajorFor(addingMajorFor === f.id ? null : f.id)}
                      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        addingMajorFor === f.id
                          ? "border-brand-purple-600/30 bg-brand-purple-50 text-brand-purple-600 dark:bg-brand-purple-400/10 dark:text-brand-purple-400"
                          : "border-foreground/15 text-foreground/65 hover:border-brand-purple-600/30 hover:text-brand-purple-600"
                      }`}
                    >
                      <PlusIcon size={11} />
                      {t("addMajorButton")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteFaculty(f.id)}
                      aria-label={t("deleteFacultyButton")}
                      title={t("deleteFacultyButton")}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-foreground/35 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>

                <div className="mt-3.5 border-t border-foreground/10 pt-3.5">
                  <p className="mb-2 text-xs font-medium text-foreground/45">
                    {t("majorsCount", { count: f.majors.length })}
                  </p>
                  {f.majors.length === 0 ? (
                    <p className="text-sm text-foreground/40">{t("noMajors")}</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {f.majors.map((m) => (
                        <span
                          key={m.id}
                          className="inline-flex items-center gap-1.5 rounded-full bg-foreground/5 py-1 pl-3 pr-1.5 text-xs text-foreground/75"
                        >
                          {m.nameTh}
                          <span className="text-foreground/35">({m.nameEn})</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteMajor(m.id)}
                            aria-label={t("deleteMajorButton")}
                            title={t("deleteMajorButton")}
                            className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-foreground/40 transition-colors hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-500/15 dark:hover:text-red-400"
                          >
                            <CloseIcon />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {addingMajorFor === f.id && (
                  <form
                    onSubmit={(e) => handleAddMajor(e, f.id)}
                    className="mt-3.5 flex flex-wrap items-end gap-2 rounded-lg bg-foreground/5 p-3"
                  >
                    <input
                      required
                      placeholder={t("majorNameThPlaceholder")}
                      value={newMajorTh}
                      onChange={(e) => setNewMajorTh(e.target.value)}
                      className="rounded-lg border border-foreground/15 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-brand-purple-600/40"
                    />
                    <input
                      required
                      placeholder={t("majorNameEnPlaceholder")}
                      value={newMajorEn}
                      onChange={(e) => setNewMajorEn(e.target.value)}
                      className="rounded-lg border border-foreground/15 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-brand-purple-600/40"
                    />
                    <button
                      type="submit"
                      disabled={pending}
                      className="rounded-full bg-brand-emerald-500 px-4 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-emerald-600 disabled:opacity-60"
                    >
                      {tCommon("save")}
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PlusIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 2.5V13.5M2.5 8H13.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M2.5 4.5H13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M6 4.5V2.8a.8.8 0 0 1 .8-.8h2.4a.8.8 0 0 1 .8.8v1.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 4.5 4.6 13a1 1 0 0 0 1 .9h4.8a1 1 0 0 0 1-.9l.6-8.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 7.3V11M9.5 7.3V11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3.5 3.5L12.5 12.5M12.5 3.5L3.5 12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function BuildingIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="3" y="2" width="10" height="12.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.5 5H6.5M9.5 5H10.5M5.5 7.5H6.5M9.5 7.5H10.5M5.5 10H6.5M9.5 10H10.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M6.5 14.5V12.3a1.5 1.5 0 0 1 1.5-1.5 1.5 1.5 0 0 1 1.5 1.5v2.2" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
