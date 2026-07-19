import type { ActivityCategory, RequestStatus, AttendanceStatus } from "@prisma/client";

// Centralized Thai labels — used across dashboard, requests, and history so
// the wording stays consistent. English/i18n switch lands in phase 5.
export const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  culture: "ทำนุบำรุงศิลปวัฒนธรรม",
  academic: "วิชาการ",
  sports: "กีฬาและส่งเสริมสุขภาพ",
  volunteer: "จิตอาสา",
  ethics: "คุณธรรมจริยธรรม",
};

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  pending: "รอตรวจสอบ",
  approved: "อนุมัติแล้ว",
  rejected: "ปฏิเสธ",
  cancelled: "ยกเลิกแล้ว",
};

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
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
