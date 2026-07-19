import { z } from "zod";

export const announcementSchema = z.object({
  title: z.string().trim().min(1, "กรุณากรอกหัวข้อประกาศ").max(200),
  body: z.string().trim().min(1, "กรุณากรอกเนื้อหาประกาศ").max(5000),
  facultyId: z.string().optional(),
  majorId: z.string().optional(),
  currentYear: z.coerce.number().int().min(1).max(8).optional(),
});
export type AnnouncementInput = z.infer<typeof announcementSchema>;
