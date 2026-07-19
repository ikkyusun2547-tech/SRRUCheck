import { z } from "zod";

export const facultySchema = z.object({
  nameTh: z.string().trim().min(1, "กรุณากรอกชื่อคณะ (ไทย)").max(200),
  nameEn: z.string().trim().min(1, "กรุณากรอกชื่อคณะ (อังกฤษ)").max(200),
});
export type FacultyInput = z.infer<typeof facultySchema>;

export const majorSchema = z.object({
  facultyId: z.string().min(1, "กรุณาเลือกคณะ"),
  nameTh: z.string().trim().min(1, "กรุณากรอกชื่อสาขา (ไทย)").max(200),
  nameEn: z.string().trim().min(1, "กรุณากรอกชื่อสาขา (อังกฤษ)").max(200),
});
export type MajorInput = z.infer<typeof majorSchema>;
