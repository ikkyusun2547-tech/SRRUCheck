import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/prisma";
import { RequestsClient } from "./requests-client";

export default async function RequestsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const closedActivities = await prisma.activity.findMany({
    where: { status: "closed" },
    orderBy: { endTime: "desc" },
    take: 50,
    select: { id: true, title: true, activityCode: true },
  });

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">คำร้อง</h1>
      <RequestsClient closedActivities={closedActivities} />
    </div>
  );
}
