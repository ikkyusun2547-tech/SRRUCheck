import { RequestsApprovalClient } from "./requests-approval-client";

export default function AdminRequestsPage() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">อนุมัติคำร้อง</h1>
      <RequestsApprovalClient />
    </div>
  );
}
