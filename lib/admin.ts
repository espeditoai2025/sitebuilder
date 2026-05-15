import { redirect } from "next/navigation";
import { getCurrentUser, type AppUser } from "./auth";
import { query } from "./db";

export async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [{ count }] = await query<{ count: string }>("select count(*)::text as count from app_users where role = 'admin'");
  const adminEmails = getAdminEmails();
  const isConfiguredAdmin = adminEmails.includes(user.email.toLowerCase());

  if (Number(count) === 0 || isConfiguredAdmin) {
    await query("update app_users set role = 'admin' where id = $1", [user.id]);
    return {
      ...user,
      role: "admin" as const
    };
  }

  if (user.role !== "admin") {
    redirect("/dashboard");
  }

  return user;
}

export function canSeeAdmin(user: AppUser | null) {
  if (!user) {
    return false;
  }

  return user.role === "admin" || getAdminEmails().includes(user.email.toLowerCase());
}

function getAdminEmails() {
  return `${process.env.ADMIN_EMAILS || ""},${process.env.OWNER_EMAIL || ""}`
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}
