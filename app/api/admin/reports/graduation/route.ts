import { execFile } from "child_process";
import path from "path";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { getPassportSummaries } from "@/lib/passport/service";
import type { GraduationReportRow } from "@/lib/reports/graduation-pdf";

// Without this, Next.js can statically optimize this GET route (no dynamic
// path segments) and cache whatever it rendered at build time — including
// a build-time 403 with no auth cookies present — and serve that stale
// response to every real request afterward instead of a fresh report.
export const dynamic = "force-dynamic";

function renderPdfInWorker(rows: GraduationReportRow[], academicYear: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const child = execFile(
      process.execPath, // node binary — no tsx/ts-node needed, worker is plain .mjs
      [path.resolve(process.cwd(), "scripts/render-pdf-worker.mjs")],
      { encoding: "buffer", maxBuffer: 50 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`PDF worker failed: ${stderr?.toString() || error.message}`));
          return;
        }
        resolve(stdout as unknown as Buffer);
      }
    );
    child.stdin!.write(JSON.stringify({ rows, academicYear }));
    child.stdin!.end();
  });
}

// Year-4 students only, per spec ("ชั้นปีที่ 4 ที่ผ่านเกณฑ์ครบ 100%") — not
// year 5+ ซ้ำชั้น students, even though they might also be close to done.
export async function GET() {
  const session = await requireAdminSession();
  if (!session) return new Response(null, { status: 403 });

  const students = await prisma.user.findMany({
    where: { role: "student", currentYear: 4 },
    include: { faculty: true, major: true },
  });

  // One bulk query set for every year-4 student — not one query per student.
  const summaries = await getPassportSummaries(students.map((s) => s.id));

  const rows: GraduationReportRow[] = students
    .filter((s) => summaries.get(s.id)?.passed)
    .map((s) => ({
      studentId: s.studentId ?? "-",
      name: [s.title, s.firstName, s.lastName].filter(Boolean).join(" ") || s.email,
      facultyMajor: `${s.faculty?.nameTh ?? "-"} / ${s.major?.nameTh ?? "-"}`,
      totalHours: summaries.get(s.id)?.totalHours ?? 0,
      totalActivitiesCount: summaries.get(s.id)?.totalActivitiesCount ?? 0,
    }))
    .sort((a, b) => a.studentId.localeCompare(b.studentId));

  const academicYear = new Date().getFullYear() + 543;

  let buffer: Buffer;
  try {
    buffer = await renderPdfInWorker(rows, academicYear);
  } catch (err) {
    console.error("graduation report PDF generation failed", err);
    return new Response("สร้างรายงาน PDF ไม่สำเร็จ", { status: 500 });
  }

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="graduation-ready-${academicYear}.pdf"`,
    },
  });
}
