import { auth } from "./auth";

/** Every admin API route must call this first — middleware only guards page
 * navigation under /admin/*, not /api/* routes. */
export async function requireAdminSession() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") return null;
  return session;
}
