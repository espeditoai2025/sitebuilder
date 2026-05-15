"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { hasDatabaseEnv, query } from "@/lib/db";

export async function login(formData: FormData) {
  if (!hasDatabaseEnv()) {
    redirect("/setup");
  }

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  const users = await query<{ id: string; password_hash: string }>(
    "select id, password_hash from app_users where email = $1 limit 1",
    [email]
  );
  const user = users[0];

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    redirect("/login?error=Credenziali non valide");
  }

  await createSession(user.id);
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signup(formData: FormData) {
  if (!hasDatabaseEnv()) {
    redirect("/setup");
  }

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const fullName = String(formData.get("full_name") || "");

  if (!email || password.length < 8) {
    redirect("/signup?error=Inserisci email e password di almeno 8 caratteri");
  }

  try {
    const passwordHash = await hashPassword(password);
    const users = await query<{ id: string }>(
      "insert into app_users (email, password_hash, full_name) values ($1, $2, $3) returning id",
      [email, passwordHash, fullName || null]
    );

    await createSession(users[0].id);
  } catch {
    redirect("/signup?error=Registrazione non riuscita");
  }

  redirect("/dashboard");
}

export async function logout() {
  if (!hasDatabaseEnv()) {
    redirect("/");
  }

  await destroySession();
  revalidatePath("/", "layout");
  redirect("/");
}
