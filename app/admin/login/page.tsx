import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LoginForm } from "./login-form";
import { BrandMark } from "@/components/brand-mark";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Team sign in",
};

export default async function AdminLoginPage() {
  const jar = await cookies();
  if (await verifyAdminSession(jar.get(ADMIN_COOKIE)?.value)) {
    redirect("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-5 py-16">
      <div className="w-full max-w-md rounded-[1.75rem] border border-line bg-white p-8 shadow-[0_20px_50px_rgba(28,24,18,0.06)]">
        <BrandMark className="h-12 w-12" />
        <h1 className="mt-5 font-serif text-3xl text-forest">Canaan Preserve team</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Review queue access. Local default password is documented in the README
          (<code className="text-ink">canaan-admin</code>) unless{" "}
          <code className="text-ink">ADMIN_PASSWORD</code> is set.
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
