"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSession, getCurrentUser, hashPassword, verifyPassword, type AppUser } from "@/lib/auth";
import { hasDatabaseEnv, query } from "@/lib/db";
import { buildQuote } from "@/lib/quote";

export async function createProject(formData: FormData) {
  if (!hasDatabaseEnv()) {
    redirect("/setup");
  }

  const user = await getWizardUser(formData);

  const websiteUrl = normalizeUrl(String(formData.get("website_url") || ""));
  const businessName = String(formData.get("business_name") || "");
  const industry = String(formData.get("industry") || "");
  const goal = String(formData.get("goal") || "");

  const projects = await query<{ id: string }>(
    `insert into projects (user_id, website_url, business_name, industry, goal, status)
     values ($1, $2, $3, $4, $5, 'submitted')
     returning id`,
    [user.id, websiteUrl, businessName || null, industry || null, goal || null]
  );
  const project = projects[0];

  if (!project) {
    redirect("/new-project?error=Impossibile creare il progetto");
  }

  revalidatePath("/dashboard");
  redirect(`/project/${project.id}`);
}

export async function selectProposal(formData: FormData) {
  if (!hasDatabaseEnv()) {
    redirect("/setup");
  }

  const projectId = String(formData.get("project_id") || "");
  const proposalId = String(formData.get("proposal_id") || "");

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [project] = await query<{ id: string; website_url: string; industry: string | null; goal: string | null }>(
    "select * from projects where id = $1 and user_id = $2 limit 1",
    [projectId, user.id]
  );
  const [proposal] = await query<{
    id: string;
    variant: string;
    homepage_structure: unknown;
  }>("select * from proposals where id = $1 and project_id = $2 limit 1", [proposalId, projectId]);

  if (!project || !proposal) {
    redirect(`/project/${projectId}?error=Proposta non trovata`);
  }

  await query("update proposals set is_selected = false where project_id = $1", [projectId]);
  await query("update proposals set is_selected = true where id = $1", [proposalId]);

  const quote = await buildQuote({ project, proposal });
  const [newQuote] = await query<{ id: string }>(
    `insert into quotes (project_id, proposal_id, price, currency, scope, timeline, status)
     values ($1, $2, $3, $4, $5::jsonb, $6, 'generated')
     returning id`,
    [projectId, proposalId, quote.price, quote.currency, JSON.stringify(quote.scope), quote.timeline]
  );

  await query("update projects set status = 'quote_generated', updated_at = now() where id = $1", [projectId]);

  revalidatePath(`/project/${projectId}`);
  redirect(newQuote ? `/project/${projectId}/quote/${newQuote.id}` : `/project/${projectId}`);
}

export async function confirmQuote(formData: FormData) {
  if (!hasDatabaseEnv()) {
    redirect("/setup");
  }

  const projectId = String(formData.get("project_id") || "");
  const quoteId = String(formData.get("quote_id") || "");

  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [project] = await query<{ id: string; website_url: string }>(
    "select * from projects where id = $1 and user_id = $2 limit 1",
    [projectId, user.id]
  );

  if (!project) {
    redirect("/dashboard");
  }

  await query("update quotes set status = 'confirmed', confirmed_at = now() where id = $1 and project_id = $2", [
    quoteId,
    projectId
  ]);

  await query("update projects set status = 'quote_confirmed', updated_at = now() where id = $1", [projectId]);

  await query("insert into notifications (project_id, type, status) values ($1, 'quote_confirmed', 'pending')", [
    projectId
  ]);

  await sendOwnerEmail({
    websiteUrl: project.website_url,
    projectId
  });

  revalidatePath(`/project/${projectId}`);
  redirect(`/project/${projectId}?confirmed=1`);
}

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = new URL(withProtocol);
  return url.toString();
}

async function sendOwnerEmail(input: { websiteUrl: string; projectId: string }) {
  if (!process.env.RESEND_API_KEY || !process.env.OWNER_EMAIL) {
    return;
  }

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: "SiteBuilder AI <onboarding@resend.dev>",
      to: process.env.OWNER_EMAIL,
      subject: "Nuovo preventivo confermato",
      html: `<p>Un cliente ha confermato il preventivo per <strong>${input.websiteUrl}</strong>.</p><p>Project ID: ${input.projectId}</p>`
    })
  });
}

async function getWizardUser(formData: FormData): Promise<AppUser> {
  const currentUser = await getCurrentUser();

  if (currentUser) {
    return currentUser;
  }

  const fullName = String(formData.get("full_name") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || password.length < 8) {
    redirect("/new-project?error=Completa email e password di almeno 8 caratteri per salvare il progetto");
  }

  const existingUsers = await query<AppUser & { password_hash: string }>(
    "select id, email, full_name, role, password_hash from app_users where email = $1 limit 1",
    [email]
  );
  const existingUser = existingUsers[0];

  if (existingUser) {
    const passwordMatches = await verifyPassword(password, existingUser.password_hash);

    if (!passwordMatches) {
      redirect("/new-project?error=Email gia registrata. Inserisci la password corretta oppure accedi");
    }

    await createSession(existingUser.id);
    return {
      id: existingUser.id,
      email: existingUser.email,
      full_name: existingUser.full_name,
      role: existingUser.role
    };
  }

  const passwordHash = await hashPassword(password);
  const [newUser] = await query<AppUser>(
    `insert into app_users (email, password_hash, full_name)
     values ($1, $2, $3)
     returning id, email, full_name, role`,
    [email, passwordHash, fullName || null]
  );

  await createSession(newUser.id);
  return newUser;
}
