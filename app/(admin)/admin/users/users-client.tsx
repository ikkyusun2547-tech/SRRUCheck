"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { FilterSelect } from "@/components/admin/filter-select";
import { EmptyState } from "@/components/admin/empty-state";
import { Pagination } from "@/components/admin/pagination";

type Major = { id: string; nameTh: string; nameEn: string; facultyId: string };
type Faculty = { id: string; nameTh: string; nameEn: string; majors: Major[] };

type UserRow = {
  id: string;
  studentId: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: "student" | "admin";
  bannedAt: string | null;
  facultyId: string | null;
  majorId: string | null;
  faculty: { nameTh: string } | null;
  major: { nameTh: string } | null;
};

export function UsersClient({ faculties }: { faculties: Faculty[] }) {
  const t = useTranslations("adminUsers");
  const tCommon = useTranslations("common");

  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [banned, setBanned] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: UserRow[]; totalPages: number; total: number } | null>(
    null
  );

  useEffect(() => {
    setPage(1);
  }, [search, role, banned]);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set("search", search);
    if (role) params.set("role", role);
    if (banned) params.set("banned", banned);
    fetch(`/api/admin/students?${params}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setData({ items: [], totalPages: 1, total: 0 });
      });
    return () => {
      cancelled = true;
    };
  }, [search, role, banned, page]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-1 rounded-xl border border-foreground/10 bg-surface p-2 shadow-sm">
        <div className="relative flex-1 basis-64">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-foreground/35">
            <SearchIcon />
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-lg bg-transparent py-2 pl-9 pr-3 text-sm outline-none placeholder:text-foreground/40"
          />
        </div>
        <div className="mx-1 h-6 w-px shrink-0 bg-foreground/10" aria-hidden />
        <FilterSelect
          value={role}
          onChange={setRole}
          placeholder={t("allRoles")}
          options={[
            { value: "student", label: t("roleStudent") },
            { value: "admin", label: t("roleAdmin") },
          ]}
        />
        <FilterSelect
          value={banned}
          onChange={setBanned}
          placeholder={t("allStatuses")}
          align="right"
          options={[
            { value: "false", label: t("statusActive") },
            { value: "true", label: t("statusBanned") },
          ]}
        />
      </div>

      {data?.items.length === 0 ? (
        <EmptyState icon={<SearchIcon size={22} />} message={tCommon("noResults")} />
      ) : (
        <div className="space-y-3">
          {data?.items.map((u) => (
            <UserRowEditor key={u.id} user={u} faculties={faculties} />
          ))}
        </div>
      )}

      {data && <Pagination page={page} totalPages={data.totalPages} total={data.total} onChange={setPage} />}
    </div>
  );
}

function UserRowEditor({ user, faculties }: { user: UserRow; faculties: Faculty[] }) {
  const t = useTranslations("adminUsers");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const name = (o: { nameTh: string; nameEn: string } | null) => (o ? (locale === "en" ? o.nameEn : o.nameTh) : "");

  const [role, setRole] = useState(user.role);
  const [banned, setBanned] = useState(Boolean(user.bannedAt));
  const [facultyId, setFacultyId] = useState(user.facultyId ?? "");
  const [majorId, setMajorId] = useState(user.majorId ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; tone: "success" | "error" } | null>(null);

  const majorsForFaculty = faculties.find((f) => f.id === facultyId)?.majors ?? [];
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          banned,
          facultyId: facultyId || null,
          majorId: majorId || null,
        }),
      });
      const data = await res.json();
      setMessage(
        res.ok ? { text: tCommon("saved"), tone: "success" } : { text: data.error ?? tCommon("saveFailed"), tone: "error" }
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-foreground/10 bg-surface p-4 shadow-sm">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple-400 to-brand-emerald-400 text-sm font-bold text-brand-purple-950">
          {initial}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
          <p className="truncate text-xs text-foreground/50">{user.email}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-foreground/10 pt-3">
        <FilterSelect
          required
          value={role}
          onChange={(v) => setRole(v as "student" | "admin")}
          placeholder={t("roleStudent")}
          options={[
            { value: "student", label: t("roleStudent") },
            { value: "admin", label: t("roleAdmin") },
          ]}
        />

        <button
          type="button"
          onClick={() => setBanned((b) => !b)}
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-colors ${
            banned
              ? "border-red-500/30 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
              : "border-foreground/15 text-foreground/60 hover:bg-foreground/5"
          }`}
        >
          <span className={`relative h-4 w-7 shrink-0 rounded-full transition-colors ${banned ? "bg-red-500" : "bg-foreground/20"}`}>
            <span
              className={`absolute left-0.5 top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-transform ${
                banned ? "translate-x-3" : "translate-x-0"
              }`}
            />
          </span>
          {t("banAccountLabel")}
        </button>

        <FilterSelect
          value={facultyId}
          onChange={(v) => {
            setFacultyId(v);
            setMajorId("");
          }}
          placeholder={t("noFaculty")}
          options={faculties.map((f) => ({ value: f.id, label: name(f) }))}
        />
        <FilterSelect
          value={majorId}
          onChange={setMajorId}
          disabled={!facultyId}
          placeholder={t("noMajor")}
          options={majorsForFaculty.map((m) => ({ value: m.id, label: name(m) }))}
        />

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="ml-auto rounded-full bg-brand-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-emerald-600 disabled:opacity-60"
        >
          {saving ? tCommon("saving") : tCommon("save")}
        </button>
        {message && (
          <span className={`text-xs font-medium ${message.tone === "success" ? "text-brand-emerald-600 dark:text-brand-emerald-400" : "text-red-600 dark:text-red-400"}`}>
            {message.text}
          </span>
        )}
      </div>
    </div>
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
