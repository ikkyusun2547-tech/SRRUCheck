import { z } from "zod";

export const decisionSchema = z.object({
  decision: z.enum(["approved", "rejected"], { error: "กรุณาระบุผลการพิจารณา" }),
  hoursApproved: z.coerce.number().positive().optional(),
  adminComment: z.string().trim().max(1000).optional(),
});
export type DecisionInput = z.infer<typeof decisionSchema>;
