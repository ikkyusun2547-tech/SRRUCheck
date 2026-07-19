import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth/auth";

const navItems = [
  { href: "/admin", label: "ภาพรวม" },
  { href: "/admin/activities", label: "กิจกรรม" },
  { href: "/admin/live", label: "Live Event Control" },
  { href: "/admin/requests", label: "คำร้อง" },
  { href: "/admin/students", label: "ข้อมูลนักศึกษา" },
  { href: "/admin/users", label: "ผู้ใช้/สิทธิ์" },
  { href: "/admin/faculties", label: "คณะ/สาขา" },
  { href: "/admin/settings", label: "ตั้งค่าเกณฑ์" },
  { href: "/admin/audit-log", label: "Audit log" },
  { href: "/admin/announcements", label: "ประกาศ" },
  { href: "/admin/reports", label: "รายงาน" },
];

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "admin") redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-1">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-foreground/10 bg-brand-purple-950 p-4 text-white sm:flex">
        <span className="mb-6 font-semibold">SRRU Check · Admin</span>
        <nav className="flex flex-col gap-2 text-sm">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="rounded px-2 py-1 hover:bg-white/10">
              {item.label}
            </Link>
          ))}
        </nav>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
          className="mt-auto"
        >
          <button type="submit" className="text-sm text-white/70 hover:text-white">
            ออกจากระบบ
          </button>
        </form>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
