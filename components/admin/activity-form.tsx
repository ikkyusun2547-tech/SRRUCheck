"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { LocationPickerMap } from "./location-picker-map";
import { FilterSelect } from "./filter-select";
import { SectionHeading } from "./section-heading";
import { fileToDataUrl } from "@/lib/file-to-data-url";

type Major = { id: string; nameTh: string; nameEn: string; facultyId: string };
type Faculty = { id: string; nameTh: string; nameEn: string; majors: Major[] };
type Restriction = { facultyId: string; majorId: string; yearLevel: string };

const MAX_COVER_BYTES = 5 * 1024 * 1024;
const ALLOWED_COVER_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type InitialActivity = {
  id: string;
  title: string;
  description: string | null;
  level: string;
  activityCategory: string;
  activityType: string;
  academicYear: number;
  semester: number;
  startTime: string;
  endTime: string;
  locationLat: number | null;
  locationLng: number | null;
  allowedRadius: number | null;
  locationName: string | null;
  creditHours: number;
  checkinMethod: string;
  requiresGps: boolean;
  activityCode: string;
  status: string;
  restrictions: { facultyId: string | null; majorId: string | null; yearLevel: number | null }[];
  coverImageUrl: string | null;
};

const currentBuddhistYear = new Date().getFullYear() + 543;
const CATEGORY_KEYS = ["culture", "academic", "sports", "volunteer", "ethics"] as const;

const inputClass =
  "w-full rounded-lg border border-foreground/15 bg-transparent px-3 py-2 text-sm outline-none focus:border-brand-purple-600/40";

export function ActivityForm({
  faculties,
  initial,
}: {
  faculties: Faculty[];
  initial?: InitialActivity;
}) {
  const t = useTranslations("adminActivityForm");
  const tActivities = useTranslations("adminActivities");
  const tCategories = useTranslations("categories");
  const locale = useLocale();
  const orgName = (o: { nameTh: string; nameEn: string }) => (locale === "en" ? o.nameEn : o.nameTh);

  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [level, setLevel] = useState(initial?.level ?? "university");
  const [category, setCategory] = useState(initial?.activityCategory ?? "");
  const [activityType, setActivityType] = useState(initial?.activityType ?? "mandatory_core");
  const [academicYear, setAcademicYear] = useState(String(initial?.academicYear ?? currentBuddhistYear));
  const [semester, setSemester] = useState(String(initial?.semester ?? 1));
  const [startTime, setStartTime] = useState(initial?.startTime ?? "");
  const [endTime, setEndTime] = useState(initial?.endTime ?? "");
  const [lat, setLat] = useState<number | null>(initial?.locationLat ?? null);
  const [lng, setLng] = useState<number | null>(initial?.locationLng ?? null);
  const [radius, setRadius] = useState(initial?.allowedRadius != null ? String(initial.allowedRadius) : "100");
  const [locationName, setLocationName] = useState(initial?.locationName ?? "");
  const [creditHours, setCreditHours] = useState(String(initial?.creditHours ?? ""));
  const [checkinMethod, setCheckinMethod] = useState(initial?.checkinMethod ?? "realtime");
  const [requiresGps, setRequiresGps] = useState(initial?.requiresGps ?? true);
  const [status, setStatus] = useState(initial?.status ?? "open");
  const [restrictions, setRestrictions] = useState<Restriction[]>(
    initial?.restrictions.map((r) => ({
      facultyId: r.facultyId ?? "",
      majorId: r.majorId ?? "",
      yearLevel: r.yearLevel != null ? String(r.yearLevel) : "",
    })) ?? []
  );
  const [coverPreview, setCoverPreview] = useState<string | null>(initial?.coverImageUrl ?? null);
  const [coverDataUrl, setCoverDataUrl] = useState<string | null>(null);
  const [coverRemoved, setCoverRemoved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function addRestriction() {
    setRestrictions((r) => [...r, { facultyId: "", majorId: "", yearLevel: "" }]);
  }
  function updateRestriction(index: number, patch: Partial<Restriction>) {
    setRestrictions((rs) => rs.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }
  function removeRestriction(index: number) {
    setRestrictions((rs) => rs.filter((_, i) => i !== index));
  }

  async function handleCoverSelect(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!ALLOWED_COVER_TYPES.has(file.type)) {
      setError(t("coverImageInvalidType"));
      return;
    }
    if (file.size > MAX_COVER_BYTES) {
      setError(t("coverImageTooLarge"));
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    setCoverDataUrl(dataUrl);
    setCoverPreview(dataUrl);
    setCoverRemoved(false);
  }

  function handleCoverRemove() {
    setCoverDataUrl(null);
    setCoverPreview(null);
    setCoverRemoved(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const payload = {
        title,
        description,
        level,
        activityCategory: category,
        activityType,
        academicYear: Number(academicYear),
        semester: Number(semester),
        startTime,
        endTime,
        locationLat: lat ?? undefined,
        locationLng: lng ?? undefined,
        allowedRadius: radius ? Number(radius) : undefined,
        locationName,
        creditHours: Number(creditHours),
        checkinMethod,
        requiresGps,
        ...(initial ? { activityCode: initial.activityCode } : {}),
        status,
        restrictions: restrictions
          .filter((r) => r.facultyId || r.majorId || r.yearLevel)
          .map((r) => ({
            facultyId: r.facultyId || undefined,
            majorId: r.majorId || undefined,
            yearLevel: r.yearLevel ? Number(r.yearLevel) : undefined,
          })),
        ...(coverDataUrl ? { coverImageDataUrl: coverDataUrl } : {}),
        ...(coverRemoved && !coverDataUrl ? { removeCoverImage: true } : {}),
      };

      const url = initial ? `/api/admin/activities/${initial.id}` : "/api/admin/activities";
      const res = await fetch(url, {
        method: initial ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("saveFailed"));
        return;
      }
      router.push("/admin/activities");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  const majorsForFaculty = (facultyId: string) => faculties.find((f) => f.id === facultyId)?.majors ?? [];

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="mx-auto max-w-2xl space-y-5">
        <div className="space-y-4 rounded-xl border border-foreground/10 bg-surface p-5 shadow-sm">
          <SectionHeading icon={<InfoIcon />}>{t("sectionBasicInfo")}</SectionHeading>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground/80">{t("sectionCoverImage")}</label>
            <CoverImageField
              preview={coverPreview}
              onSelect={handleCoverSelect}
              onRemove={handleCoverRemove}
              uploadLabel={t("coverImageUploadButton")}
              changeLabel={t("coverImageChangeButton")}
              removeLabel={t("coverImageRemoveButton")}
            />
            <p className="mt-1.5 text-xs text-foreground/50">{t("coverImageHint")}</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground/80">{t("titleLabel")}</label>
            <input required value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
          </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground/80">{t("descriptionLabel")}</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputClass} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/80">{t("levelLabel")}</label>
                <div className="rounded-lg border border-foreground/15">
                  <FilterSelect
                    required
                    fullWidth
                    value={level}
                    onChange={setLevel}
                    placeholder={tActivities("levelUniversity")}
                    options={[
                      { value: "university", label: tActivities("levelUniversity") },
                      { value: "faculty", label: tActivities("levelFaculty") },
                    ]}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/80">{t("categoryLabel")}</label>
                <div className="rounded-lg border border-foreground/15">
                  <FilterSelect
                    required
                    fullWidth
                    value={category}
                    onChange={setCategory}
                    placeholder={t("categoryPlaceholder")}
                    options={CATEGORY_KEYS.map((k) => ({ value: k, label: tCategories(k) }))}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-foreground/10 bg-surface p-5 shadow-sm">
            <SectionHeading icon={<CalendarIcon />}>{t("sectionSchedule")}</SectionHeading>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/80">{t("typeLabel")}</label>
                <div className="rounded-lg border border-foreground/15">
                  <FilterSelect
                    required
                    fullWidth
                    value={activityType}
                    onChange={setActivityType}
                    placeholder={t("typeMandatoryCore")}
                    options={[
                      { value: "mandatory_core", label: t("typeMandatoryCore") },
                      { value: "mandatory_elective", label: t("typeMandatoryElective") },
                      { value: "practice", label: t("typePractice") },
                    ]}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/80">{t("academicYearLabel")}</label>
                <input
                  required
                  type="number"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/80">{t("semesterLabel")}</label>
                <div className="rounded-lg border border-foreground/15">
                  <FilterSelect
                    required
                    fullWidth
                    value={semester}
                    onChange={setSemester}
                    placeholder={t("semester1")}
                    options={[
                      { value: "1", label: t("semester1") },
                      { value: "2", label: t("semester2") },
                      { value: "3", label: t("semesterSummer") },
                    ]}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/80">{t("startTimeLabel")}</label>
                <input
                  required
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/80">{t("endTimeLabel")}</label>
                <input
                  required
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/80">{t("activityCodeLabel")}</label>
                {initial ? (
                  <input
                    readOnly
                    disabled
                    value={initial.activityCode}
                    className={`${inputClass} font-mono text-foreground/60`}
                  />
                ) : (
                  <p className="flex h-[38px] items-center rounded-lg border border-dashed border-foreground/15 px-3 text-xs text-foreground/45">
                    {t("activityCodeAutoNote")}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/80">{t("creditHoursLabel")}</label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.5"
                  value={creditHours}
                  onChange={(e) => setCreditHours(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-foreground/10 bg-surface p-5 shadow-sm">
            <SectionHeading icon={<QrIcon />}>{t("sectionCheckin")}</SectionHeading>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/80">{t("checkinMethodLabel")}</label>
                <div className="rounded-lg border border-foreground/15">
                  <FilterSelect
                    required
                    fullWidth
                    value={checkinMethod}
                    onChange={setCheckinMethod}
                    placeholder={tActivities("checkinRealtime")}
                    options={[
                      { value: "realtime", label: tActivities("checkinRealtime") },
                      { value: "self_report", label: tActivities("checkinSelfReport") },
                    ]}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-foreground/80">{t("statusLabel")}</label>
                <div className="rounded-lg border border-foreground/15">
                  <FilterSelect
                    required
                    fullWidth
                    value={status}
                    onChange={setStatus}
                    placeholder={tActivities("statusOpen")}
                    options={[
                      { value: "open", label: tActivities("statusOpen") },
                      { value: "closed", label: tActivities("statusClosed") },
                      { value: "cancelled", label: tActivities("statusCancelled") },
                    ]}
                  />
                </div>
              </div>
            </div>

            {checkinMethod === "realtime" && (
              <button
                type="button"
                onClick={() => setRequiresGps((v) => !v)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-colors ${
                  requiresGps
                    ? "border-brand-purple-600/30 bg-brand-purple-50 text-brand-purple-700 dark:bg-brand-purple-400/10 dark:text-brand-purple-400"
                    : "border-foreground/15 text-foreground/60 hover:bg-foreground/5"
                }`}
              >
                <span
                  className={`relative h-4 w-7 shrink-0 rounded-full transition-colors ${requiresGps ? "bg-brand-purple-600" : "bg-foreground/20"}`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-transform ${
                      requiresGps ? "translate-x-3" : "translate-x-0"
                    }`}
                  />
                </span>
                {t("requiresGpsLabel")}
              </button>
            )}
          </div>

          {checkinMethod === "realtime" && requiresGps && (
            <div className="space-y-4 rounded-xl border border-foreground/10 bg-surface p-5 shadow-sm">
              <SectionHeading icon={<PinIcon />}>{t("sectionLocation")}</SectionHeading>
              <p className="text-xs text-foreground/55">{t("mapHint")}</p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-foreground/55">{t("latitudeLabel")}</label>
                  <input
                    type="number"
                    step="any"
                    value={lat ?? ""}
                    onChange={(e) => setLat(e.target.value === "" ? null : Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-foreground/55">{t("longitudeLabel")}</label>
                  <input
                    type="number"
                    step="any"
                    value={lng ?? ""}
                    onChange={(e) => setLng(e.target.value === "" ? null : Number(e.target.value))}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-foreground/10">
                <LocationPickerMap
                  lat={lat}
                  lng={lng}
                  radius={radius ? Number(radius) : null}
                  onChange={(newLat, newLng) => {
                    setLat(newLat);
                    setLng(newLng);
                  }}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-foreground/55">{t("radiusLabel")}</label>
                  <input type="number" min="1" value={radius} onChange={(e) => setRadius(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-foreground/55">{t("locationNameLabel")}</label>
                  <input value={locationName} onChange={(e) => setLocationName(e.target.value)} className={inputClass} />
                </div>
              </div>
              {lat != null && lng != null && (
                <p className="text-xs text-foreground/50">{t("selectedPosition", { lat: lat.toFixed(6), lng: lng.toFixed(6) })}</p>
              )}
            </div>
          )}

          <div className="space-y-4 rounded-xl border border-foreground/10 bg-surface p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <SectionHeading icon={<UsersGroupIcon />}>{t("sectionRestrictions")}</SectionHeading>
              <button
                type="button"
                onClick={addRestriction}
                className="inline-flex items-center gap-1 rounded-full border border-foreground/15 px-3 py-1.5 text-xs font-medium text-foreground/65 transition-colors hover:border-brand-purple-600/30 hover:text-brand-purple-600"
              >
                <PlusIcon />
                {t("addRestrictionButton")}
              </button>
            </div>
            {restrictions.length === 0 && <p className="text-xs text-foreground/50">{t("restrictionsHint")}</p>}
            <div className="space-y-2">
              {restrictions.map((r, i) => (
                <div key={i} className="flex flex-wrap items-center gap-1 rounded-lg border border-foreground/10 p-1.5">
                  <FilterSelect
                    value={r.facultyId}
                    onChange={(v) => updateRestriction(i, { facultyId: v, majorId: "" })}
                    placeholder={t("restrictionAllFaculties")}
                    options={faculties.map((f) => ({ value: f.id, label: orgName(f) }))}
                  />
                  <FilterSelect
                    value={r.majorId}
                    disabled={!r.facultyId}
                    onChange={(v) => updateRestriction(i, { majorId: v })}
                    placeholder={t("restrictionAllMajors")}
                    options={majorsForFaculty(r.facultyId).map((m) => ({ value: m.id, label: orgName(m) }))}
                  />
                  <FilterSelect
                    value={r.yearLevel}
                    onChange={(v) => updateRestriction(i, { yearLevel: v })}
                    placeholder={t("restrictionAllYears")}
                    options={[1, 2, 3, 4, 5, 6].map((y) => ({ value: String(y), label: t("restrictionYear", { year: y }) }))}
                  />
                  <button
                    type="button"
                    onClick={() => removeRestriction(i)}
                    aria-label={t("removeRestrictionButton")}
                    title={t("removeRestrictionButton")}
                    className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-foreground/35 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))}
            </div>
          </div>

        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-brand-emerald-500 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-emerald-600 disabled:opacity-60"
        >
          {pending ? t("saving") : t("saveButton")}
        </button>
      </div>
    </form>
  );
}

function CoverImageField({
  preview,
  onSelect,
  onRemove,
  uploadLabel,
  changeLabel,
  removeLabel,
}: {
  preview: string | null;
  onSelect: (file: File | undefined) => void;
  onRemove: () => void;
  uploadLabel: string;
  changeLabel: string;
  removeLabel: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      {preview ? (
        <div className="group relative overflow-hidden rounded-xl border border-foreground/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="" className="h-40 w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-end gap-1.5 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-2.5">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-foreground/80 shadow-sm transition-colors hover:bg-white"
            >
              {changeLabel}
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-red-600 shadow-sm transition-colors hover:bg-white"
            >
              {removeLabel}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-foreground/20 text-foreground/40 transition-colors hover:border-brand-purple-600/30 hover:text-brand-purple-600"
        >
          <ImageIcon size={22} />
          <span className="text-xs font-medium">{uploadLabel}</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => onSelect(e.target.files?.[0])}
      />
    </div>
  );
}

function InfoIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 7.3V11.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="8" cy="5" r="0.9" fill="currentColor" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 6.5H14" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5 1.5V4M11 1.5V4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function QrIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="2" y="2" width="4.5" height="4.5" rx="0.8" stroke="currentColor" strokeWidth="1.3" />
      <rect x="9.5" y="2" width="4.5" height="4.5" rx="0.8" stroke="currentColor" strokeWidth="1.3" />
      <rect x="2" y="9.5" width="4.5" height="4.5" rx="0.8" stroke="currentColor" strokeWidth="1.3" />
      <path d="M9.5 9.5H12M13.5 9.5H14M9.5 12H10.5M12 12H14M9.5 14H14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M8 14.5s5-4.2 5-8.2a5 5 0 0 0-10 0c0 4 5 8.2 5 8.2Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="6.3" r="1.8" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function UsersGroupIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="6" cy="5.5" r="2.2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1.8 13.5c0-2.3 1.9-4 4.2-4s4.2 1.7 4.2 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M10.8 4.2a2.2 2.2 0 0 1 0 4.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M11.5 9.6c1.9.3 3.3 1.8 3.3 3.9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
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

function ImageIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="5.3" cy="6.3" r="1.3" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2 12L6 8.5L8.5 10.5L11 7.5L14.5 11.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
