import { Suspense } from "react";
import { CheckinFlow } from "./checkin-flow";

export default function CheckinPage() {
  return (
    <div className="flex flex-col items-center gap-4">
      <h1 className="self-start text-xl font-semibold">เช็คชื่อกิจกรรม</h1>
      <Suspense fallback={<p className="text-sm text-foreground/50">กำลังโหลด...</p>}>
        <CheckinFlow />
      </Suspense>
    </div>
  );
}
