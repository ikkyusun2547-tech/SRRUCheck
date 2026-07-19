import { auth } from "@/lib/auth/auth";

export default async function ProfilePage() {
  const session = await auth();
  return (
    <div>
      <h1 className="text-xl font-semibold">โปรไฟล์</h1>
      <p className="mt-2 text-foreground/70">{session?.user?.email}</p>
    </div>
  );
}
