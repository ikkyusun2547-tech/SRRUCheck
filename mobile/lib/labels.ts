// Mirrors lib/labels.ts on the web — pure string constants, no server
// dependency, safe to duplicate as UI-only display labels (same reasoning
// as mobile/lib/qr-token.ts).
export const CATEGORY_LABELS: Record<string, string> = {
  culture: "ทำนุบำรุงศิลปวัฒนธรรม",
  academic: "วิชาการ",
  sports: "กีฬาและส่งเสริมสุขภาพ",
  volunteer: "จิตอาสา",
  ethics: "คุณธรรมจริยธรรม",
};

export const REQUEST_STATUS_LABELS: Record<string, string> = {
  pending: "รอตรวจสอบ",
  approved: "อนุมัติแล้ว",
  rejected: "ปฏิเสธ",
  cancelled: "ยกเลิกแล้ว",
};

export const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  auto_approved: "อนุมัติอัตโนมัติ",
  flagged: "รอตรวจสอบ",
  rejected: "ปฏิเสธ",
};

export const FLAG_REASON_LABELS: Record<string, string> = {
  GPS_OUT_OF_BOUNDS: "อยู่นอกระยะที่กำหนดของกิจกรรม",
  DEVICE_SHARING_SUSPECTED: "อุปกรณ์นี้เคยถูกใช้เช็คชื่อกิจกรรมนี้จากบัญชีอื่นมาก่อน",
  PRINTED_QR_USED: "ใช้ QR สำรอง ไม่ใช่ QR สดหน้างาน",
  SELF_REPORTED: "รอเจ้าหน้าที่ตรวจสอบหลักฐาน",
};
