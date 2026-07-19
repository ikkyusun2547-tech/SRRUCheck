// Runs OUTSIDE Next.js's webpack bundling entirely — plain Node, invoked as
// a child process from the graduation report route. @react-pdf/renderer's
// bundled reconciler breaks (React error #31, element-shape mismatch) when
// its JSX is compiled/bundled by webpack alongside the rest of the app, but
// works perfectly as a standalone script — this file IS that standalone
// script, just parameterized via stdin/stdout instead of hardcoded data.
import path from "path";
import { createElement } from "react";
import { Document, Page, Text, View, Font, StyleSheet, renderToBuffer } from "@react-pdf/renderer";

Font.register({
  family: "Sarabun",
  fonts: [
    { src: path.resolve("node_modules/@fontsource/sarabun/files/sarabun-thai-400-normal.woff") },
    {
      src: path.resolve("node_modules/@fontsource/sarabun/files/sarabun-thai-700-normal.woff"),
      fontWeight: 700,
    },
  ],
});

const styles = StyleSheet.create({
  page: { fontFamily: "Sarabun", padding: 30, fontSize: 10 },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 4, textAlign: "center" },
  subtitle: { fontSize: 11, marginBottom: 12, textAlign: "center" },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#ddd", paddingVertical: 4 },
  headerRow: { flexDirection: "row", borderBottomWidth: 1.5, borderBottomColor: "#000", paddingVertical: 4 },
  headerCell: { fontWeight: 700, fontSize: 9 },
  no: { width: "6%" },
  studentId: { width: "14%" },
  name: { width: "26%" },
  facultyMajor: { width: "30%" },
  hours: { width: "12%", textAlign: "right" },
  activities: { width: "12%", textAlign: "right" },
  footer: { marginTop: 20, fontSize: 9, color: "#555" },
});

function buildDocument(rows, academicYear) {
  const h = createElement;
  return h(
    Document,
    null,
    h(
      Page,
      { size: "A4", style: styles.page },
      h(
        Text,
        { style: styles.title },
        `รายชื่อนักศึกษาชั้นปีที่ 4 ที่ผ่านเกณฑ์กิจกรรมครบถ้วน ปีการศึกษา ${academicYear}`
      ),
      h(Text, { style: styles.subtitle }, "มหาวิทยาลัยราชภัฏสุรินทร์ — ส่งสำนักทะเบียนและประมวลผล"),
      h(
        View,
        null,
        h(
          View,
          { style: styles.headerRow },
          h(Text, { style: [styles.headerCell, styles.no] }, "ลำดับ"),
          h(Text, { style: [styles.headerCell, styles.studentId] }, "รหัสนักศึกษา"),
          h(Text, { style: [styles.headerCell, styles.name] }, "ชื่อ-นามสกุล"),
          h(Text, { style: [styles.headerCell, styles.facultyMajor] }, "คณะ/สาขา"),
          h(Text, { style: [styles.headerCell, styles.hours] }, "ชั่วโมงสะสม"),
          h(Text, { style: [styles.headerCell, styles.activities] }, "จำนวนกิจกรรม")
        ),
        ...rows.map((r, i) =>
          h(
            View,
            { style: styles.row, key: r.studentId, wrap: false },
            h(Text, { style: styles.no }, String(i + 1)),
            h(Text, { style: styles.studentId }, r.studentId),
            h(Text, { style: styles.name }, r.name),
            h(Text, { style: styles.facultyMajor }, r.facultyMajor),
            h(Text, { style: styles.hours }, String(r.totalHours)),
            h(Text, { style: styles.activities }, String(r.totalActivitiesCount))
          )
        )
      ),
      h(Text, { style: styles.footer }, `รวมทั้งสิ้น ${rows.length} คน — พิมพ์จากระบบ SRRU Check`)
    )
  );
}

async function main() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const input = JSON.parse(Buffer.concat(chunks).toString("utf-8"));

  const buffer = await renderToBuffer(buildDocument(input.rows, input.academicYear));
  process.stdout.write(buffer);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
