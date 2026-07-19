import { z } from "zod";

const currentBuddhistYear = new Date().getFullYear() + 543;

export const TITLE_OPTIONS = ["นาย", "นาง", "นางสาว"] as const;

export const profileSchema = z.object({
  title: z.string().trim().min(1, "กรุณาเลือกคำนำหน้า").max(20),
  firstName: z.string().trim().min(1, "กรุณากรอกชื่อ").max(100),
  lastName: z.string().trim().min(1, "กรุณากรอกนามสกุล").max(100),
  studentId: z
    .string()
    .trim()
    .regex(/^\d{11}$/, "รหัสนักศึกษาต้องเป็นตัวเลข 11 หลัก"),
  enrollmentYear: z.coerce
    .number()
    .int()
    .min(currentBuddhistYear - 15, "ปีที่เข้าศึกษาไม่ถูกต้อง")
    .max(currentBuddhistYear, "ปีที่เข้าศึกษาไม่ถูกต้อง"),
  currentYear: z.coerce
    .number()
    .int()
    .min(1, "ชั้นปีไม่ถูกต้อง")
    .max(8, "ชั้นปีไม่ถูกต้อง"),
  programType: z.enum(["normal", "special"], {
    error: "กรุณาเลือกประเภทหลักสูตร",
  }),
  facultyId: z.string().trim().min(1, "กรุณาเลือกคณะ"),
  majorId: z.string().trim().min(1, "กรุณาเลือกสาขา"),
});

export type ProfileInput = z.infer<typeof profileSchema>;
