import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    if (!session.user.profileCompleted) redirect("/setup-profile");
    redirect(session.user.role === "admin" ? "/admin" : "/dashboard");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-gradient-to-b from-brand-purple-950 to-brand-purple-800 px-6 py-24 text-center text-white">
      <h1 className="text-3xl font-bold sm:text-4xl">SRRU Check</h1>
      <p className="max-w-md text-white/80">
        ระบบบริหารจัดการและเช็คชื่อกิจกรรมนักศึกษา มหาวิทยาลัยราชภัฏสุรินทร์
      </p>
      <Link
        href="/login"
        className="rounded-full bg-brand-emerald-500 px-8 py-3 font-medium text-white transition-colors hover:bg-brand-emerald-600"
      >
        เข้าสู่ระบบ
      </Link>
    </div>
  );
}
