import { z } from "zod";

export const activityRestrictionSchema = z
  .object({
    facultyId: z.string().trim().optional().or(z.literal("")),
    majorId: z.string().trim().optional().or(z.literal("")),
    yearLevel: z.coerce.number().int().min(1).max(8).optional(),
  })
  .refine((r) => r.facultyId || r.majorId || r.yearLevel, {
    message: "แต่ละเงื่อนไขต้องระบุอย่างน้อยหนึ่งอย่าง (คณะ/สาขา/ชั้นปี)",
  });

export const activitySchema = z
  .object({
    title: z.string().trim().min(1, "กรุณากรอกชื่อกิจกรรม").max(300),
    description: z.string().trim().max(2000).optional().or(z.literal("")),
    level: z.enum(["university", "faculty"], { error: "กรุณาเลือกระดับ" }),
    activityCategory: z.enum(["culture", "academic", "sports", "volunteer", "ethics"], {
      error: "กรุณาเลือกหมวดหมู่",
    }),
    activityType: z.enum(["mandatory_core", "mandatory_elective", "practice"], {
      error: "กรุณาเลือกลักษณะกิจกรรม",
    }),
    academicYear: z.coerce.number().int().min(2500).max(2700),
    semester: z.coerce.number().int().min(1).max(3),
    startTime: z.string().min(1, "กรุณาระบุเวลาเริ่ม"),
    endTime: z.string().min(1, "กรุณาระบุเวลาสิ้นสุด"),
    locationLat: z.coerce.number().min(-90).max(90).optional(),
    locationLng: z.coerce.number().min(-180).max(180).optional(),
    allowedRadius: z.coerce.number().positive().max(100000).optional(),
    locationName: z.string().trim().max(300).optional().or(z.literal("")),
    creditHours: z.coerce.number().positive("ชั่วโมงต้องมากกว่า 0").max(1000),
    checkinMethod: z.enum(["realtime", "self_report"], { error: "กรุณาเลือกวิธีเช็คชื่อ" }),
    requiresGps: z.boolean(),
    /** Server-generated on create (see lib/admin/activity-code.ts) — present
     * here only so an edit submission can round-trip the existing code. */
    activityCode: z.string().trim().max(50).optional(),
    status: z.enum(["open", "closed", "cancelled"]).default("open"),
    restrictions: z.array(activityRestrictionSchema).optional().default([]),
    /** A newly-selected cover image, base64-encoded — omitted when the existing
     * (or absent) cover image isn't being changed. */
    coverImageDataUrl: z.string().optional(),
    /** Explicitly clears the cover image without uploading a replacement. */
    removeCoverImage: z.boolean().optional(),
  })
  .refine((d) => new Date(d.endTime) > new Date(d.startTime), {
    message: "เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่ม",
    path: ["endTime"],
  })
  .refine((d) => d.checkinMethod !== "realtime" || !d.requiresGps || (d.locationLat != null && d.locationLng != null && d.allowedRadius != null), {
    message: "กิจกรรมที่ต้องใช้ GPS ต้องปักหมุดตำแหน่งและระบุรัศมี",
    path: ["locationLat"],
  });

export type ActivityInput = z.infer<typeof activitySchema>;
