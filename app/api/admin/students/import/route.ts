import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { requireAdminSession } from "@/lib/auth/require-admin";
import { importStudentRows } from "@/lib/admin/student-import";

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "กรุณาแนบไฟล์ Excel (.xlsx)" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = new ExcelJS.Workbook();
  try {
    // exceljs's bundled types predate @types/node's generic Buffer<T> — same
    // runtime type, just a stale type-def mismatch across packages.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await workbook.xlsx.load(buffer as any);
  } catch {
    return NextResponse.json({ error: "อ่านไฟล์ Excel ไม่สำเร็จ กรุณาตรวจสอบรูปแบบไฟล์" }, { status: 400 });
  }

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    return NextResponse.json({ error: "ไม่พบข้อมูลในไฟล์" }, { status: 400 });
  }

  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell((cell, colNumber) => {
    headers[colNumber] = String(cell.value ?? "").trim();
  });

  const rows: Record<string, unknown>[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const record: Record<string, unknown> = {};
    row.eachCell((cell, colNumber) => {
      const header = headers[colNumber];
      if (header) record[header] = cell.value;
    });
    if (Object.values(record).some((v) => v != null && v !== "")) {
      rows.push(record);
    }
  });

  if (rows.length === 0) {
    return NextResponse.json({ error: "ไม่พบแถวข้อมูลในไฟล์" }, { status: 400 });
  }
  if (rows.length > 2000) {
    return NextResponse.json({ error: "นำเข้าได้สูงสุด 2000 แถวต่อครั้ง" }, { status: 400 });
  }

  const { results, summary } = await importStudentRows(rows);
  return NextResponse.json({ results, summary });
}
