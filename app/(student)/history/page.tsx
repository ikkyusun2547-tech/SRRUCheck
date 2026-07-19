import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { HistoryClient } from "./history-client";

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">ประวัติกิจกรรม</h1>
      <HistoryClient />
    </div>
  );
}
