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
    <main className="flex min-h-screen items-center justify-center bg-paper px-5 py-16">
      <div className="surface-card w-full max-w-md p-8">
        <BrandMark className="h-14 w-auto" decorative={false} />
        <h1 className="type-h2 mt-5 text-forest">Canaan Preserve team</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Review queue access. Sign in with the team password.
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
