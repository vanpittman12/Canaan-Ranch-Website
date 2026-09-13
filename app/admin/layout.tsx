import { requireAdmin } from "@/app/actions/admin";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jar = await cookies();
  const authed = verifyAdminSession(jar.get(ADMIN_COOKIE)?.value);
  if (authed) {
    await requireAdmin();
  }
  return children;
}
