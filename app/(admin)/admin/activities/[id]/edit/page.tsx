import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ActivityForm } from "@/components/admin/activity-form";
import { toThaiDatetimeLocalValue } from "@/lib/admin/datetime";

export default async function EditActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [activity, faculties] = await Promise.all([
    prisma.activity.findUnique({ where: { id }, include: { restrictions: true } }),
    prisma.faculty.findMany({
      orderBy: { nameTh: "asc" },
      include: { majors: { orderBy: { nameTh: "asc" } } },
    }),
  ]);

  if (!activity) notFound();

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">แก้ไขกิจกรรม</h1>
      <ActivityForm
        faculties={faculties}
        initial={{
          id: activity.id,
          title: activity.title,
          description: activity.description,
          level: activity.level,
          activityCategory: activity.activityCategory,
          activityType: activity.activityType,
          academicYear: activity.academicYear,
          semester: activity.semester,
          startTime: toThaiDatetimeLocalValue(activity.startTime),
          endTime: toThaiDatetimeLocalValue(activity.endTime),
          locationLat: activity.locationLat,
          locationLng: activity.locationLng,
          allowedRadius: activity.allowedRadius,
          locationName: activity.locationName,
          creditHours: activity.creditHours,
          checkinMethod: activity.checkinMethod,
          requiresGps: activity.requiresGps,
          activityCode: activity.activityCode,
          status: activity.status,
          restrictions: activity.restrictions,
        }}
      />
    </div>
  );
}
