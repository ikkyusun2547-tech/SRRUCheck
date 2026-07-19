import { NotificationsClient } from "./notifications-client";

export default function NotificationsPage() {
  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">การแจ้งเตือน</h1>
      <NotificationsClient />
    </div>
  );
}
