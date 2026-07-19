import { z } from "zod";

export const externalActivityRequestSchema = z.object({
  title: z.string().trim().min(1, "กรุณากรอกชื่อกิจกรรม").max(200),
  activityCategory: z.enum(["culture", "academic", "sports", "volunteer", "ethics"], {
    error: "กรุณาเลือกหมวดหมู่",
  }),
  hoursRequested: z.coerce.number().positive("ชั่วโมงต้องมากกว่า 0").max(500),
  evidenceDataUrl: z.string().min(1, "กรุณาแนบหลักฐาน"),
});
export type ExternalActivityRequestInput = z.infer<typeof externalActivityRequestSchema>;

export const creditTransferRequestSchema = z.object({
  title: z.string().trim().min(1, "กรุณากรอกชื่อตำแหน่ง/เหตุผล").max(200),
  hoursRequested: z.coerce.number().positive("ชั่วโมงต้องมากกว่า 0").max(500),
  evidenceDataUrl: z.string().min(1, "กรุณาแนบหลักฐาน"),
});
export type CreditTransferRequestInput = z.infer<typeof creditTransferRequestSchema>;

export const lateCheckInRequestSchema = z.object({
  activityId: z.string().min(1, "กรุณาเลือกกิจกรรม"),
  reason: z.string().trim().min(1, "กรุณาระบุเหตุผล").max(1000),
});
export type LateCheckInRequestInput = z.infer<typeof lateCheckInRequestSchema>;
