import { z } from "zod";

const programCriteriaSchema = z.object({
  requiredActivities: z.coerce.number().int().positive(),
  requiredHours: z.coerce.number().positive(),
  yearlyHourTargets: z.tuple([
    z.coerce.number().nonnegative(),
    z.coerce.number().nonnegative(),
    z.coerce.number().nonnegative(),
    z.coerce.number().nonnegative(),
  ]),
});

export const settingsUpdateSchema = z.object({
  criteria: z.object({
    normal: programCriteriaSchema,
    special: programCriteriaSchema,
  }),
  externalActivityHourCap: z.coerce.number().positive(),
  creditTransferHourCap: z.coerce.number().positive(),
});
export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>;
