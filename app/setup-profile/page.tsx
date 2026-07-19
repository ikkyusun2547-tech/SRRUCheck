import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";

export default async function SetupProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-24 text-center">
      <h1 className="text-2xl font-bold">กรอกโปรไฟล์ครั้งแรก</h1>
      <p className="max-w-md text-foreground/70">
        ยินดีต้อนรับ {session.user.email} — ฟอร์มกรอกโปรไฟล์ (คำนำหน้า, ชื่อ-นามสกุล,
        รหัสนักศึกษา, คณะ/สาขา ฯลฯ) จะถูกสร้างในเฟสถัดไป
      </p>
    </div>
  );
}
