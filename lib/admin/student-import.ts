import { prisma } from "@/lib/prisma";

// Expected worksheet columns (first row = these exact Thai headers, any order):
// รหัสนักศึกษา | คำนำหน้า | ชื่อ | นามสกุล | อีเมล | ปีที่เข้าศึกษา | ชั้นปี | ประเภทหลักสูตร (ปกติ/กศ.บป.) | คณะ | สาขา
const REQUIRED_HEADERS = [
  "รหัสนักศึกษา",
  "คำนำหน้า",
  "ชื่อ",
  "นามสกุล",
  "อีเมล",
  "ปีที่เข้าศึกษา",
  "ชั้นปี",
  "ประเภทหลักสูตร",
  "คณะ",
  "สาขา",
] as const;

export type ImportRowResult = { row: number; status: "created" | "updated" | "skipped"; reason?: string };

function cellToString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "object" && "text" in (value as Record<string, unknown>)) {
    return String((value as { text: unknown }).text ?? "").trim();
  }
  return String(value).trim();
}

export async function importStudentRows(
  rows: Record<string, unknown>[]
): Promise<{ results: ImportRowResult[]; summary: { created: number; updated: number; skipped: number } }> {
  const faculties = await prisma.faculty.findMany({ include: { majors: true } });
  const results: ImportRowResult[] = [];

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 2; // +1 for header row, +1 for 1-indexing
    const row = rows[i];

    const studentId = cellToString(row["รหัสนักศึกษา"]);
    const title = cellToString(row["คำนำหน้า"]);
    const firstName = cellToString(row["ชื่อ"]);
    const lastName = cellToString(row["นามสกุล"]);
    const email = cellToString(row["อีเมล"]).toLowerCase();
    const enrollmentYear = Number(cellToString(row["ปีที่เข้าศึกษา"]));
    const currentYear = Number(cellToString(row["ชั้นปี"]));
    const programTypeRaw = cellToString(row["ประเภทหลักสูตร"]);
    const facultyNameTh = cellToString(row["คณะ"]);
    const majorNameTh = cellToString(row["สาขา"]);

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      results.push({ row: rowNum, status: "skipped", reason: "อีเมลไม่ถูกต้องหรือว่าง" });
      continue;
    }
    if (!/^\d{11}$/.test(studentId)) {
      results.push({ row: rowNum, status: "skipped", reason: "รหัสนักศึกษาต้องเป็นตัวเลข 11 หลัก" });
      continue;
    }
    const programType = programTypeRaw.includes("กศ.บป") ? "special" : "normal";

    const faculty = faculties.find((f) => f.nameTh === facultyNameTh);
    if (!faculty) {
      results.push({ row: rowNum, status: "skipped", reason: `ไม่พบคณะ "${facultyNameTh}" ในระบบ` });
      continue;
    }
    const major = faculty.majors.find((m) => m.nameTh === majorNameTh);
    if (!major) {
      results.push({ row: rowNum, status: "skipped", reason: `ไม่พบสาขา "${majorNameTh}" ในคณะ "${facultyNameTh}"` });
      continue;
    }
    if (!Number.isFinite(enrollmentYear) || !Number.isFinite(currentYear)) {
      results.push({ row: rowNum, status: "skipped", reason: "ปีที่เข้าศึกษา/ชั้นปีไม่ถูกต้อง" });
      continue;
    }

    try {
      const existing = await prisma.user.findUnique({ where: { email } });
      await prisma.user.upsert({
        where: { email },
        create: {
          email,
          studentId,
          title,
          firstName,
          lastName,
          enrollmentYear,
          currentYear,
          programType,
          facultyId: faculty.id,
          majorId: major.id,
          role: "student",
          profileCompleted: true,
        },
        update: {
          studentId,
          title,
          firstName,
          lastName,
          enrollmentYear,
          currentYear,
          programType,
          facultyId: faculty.id,
          majorId: major.id,
        },
      });
      results.push({ row: rowNum, status: existing ? "updated" : "created" });
    } catch {
      results.push({ row: rowNum, status: "skipped", reason: "รหัสนักศึกษาซ้ำกับผู้ใช้อื่นในระบบ" });
    }
  }

  return {
    results,
    summary: {
      created: results.filter((r) => r.status === "created").length,
      updated: results.filter((r) => r.status === "updated").length,
      skipped: results.filter((r) => r.status === "skipped").length,
    },
  };
}

export { REQUIRED_HEADERS };
