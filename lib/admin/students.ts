import { z } from "zod";

export const userManageSchema = z.object({
  role: z.enum(["student", "admin"]).optional(),
  banned: z.boolean().optional(),
  facultyId: z.string().nullable().optional(),
  majorId: z.string().nullable().optional(),
});
export type UserManageInput = z.infer<typeof userManageSchema>;

export type StudentSearchParams = {
  search?: string;
  facultyId?: string;
  majorId?: string;
  currentYear?: number;
  page: number;
  pageSize: number;
};
