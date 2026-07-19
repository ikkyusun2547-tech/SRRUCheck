// The actual PDF rendering lives in scripts/render-pdf-worker.mjs, run as a
// child process by app/api/admin/reports/graduation/route.ts — not here.
// @react-pdf/renderer's bundled reconciler breaks (React error #31) when its
// JSX is compiled/bundled by webpack alongside the rest of the app; it only
// works as a plain, unbundled Node script. This file just keeps the shared
// row shape in one place so the route and worker agree on it.
export type GraduationReportRow = {
  studentId: string;
  name: string;
  facultyMajor: string;
  totalHours: number;
  totalActivitiesCount: number;
};
