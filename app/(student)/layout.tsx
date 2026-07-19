import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth/auth";

const navItems = [
  { href: "/dashboard", label: "แดชบอร์ด" },
  { href: "/activities", label: "กิจกรรม" },
  { href: "/checkin", label: "เช็คชื่อ" },
  { href: "/requests", label: "คำร้อง" },
  { href: "/history", label: "ประวัติ" },
  { href: "/notifications", label: "แจ้งเตือน" },
  { href: "/profile", label: "โปรไฟล์" },
];

export default async function StudentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-foreground/10 bg-brand-purple-950 px-4 py-3 text-white">
        <span className="font-semibold">SRRU Check</span>
        <nav className="hidden gap-4 text-sm sm:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-brand-emerald-500">
              {item.label}
            </Link>
          ))}
        </nav>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button type="submit" className="text-sm text-white/70 hover:text-white">
            ออกจากระบบ
          </button>
        </form>
      </header>
      <nav className="flex gap-3 overflow-x-auto border-b border-foreground/10 px-4 py-2 text-sm sm:hidden">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="whitespace-nowrap">
            {item.label}
          </Link>
        ))}
      </nav>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
