"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { buildQuote } from "@/lib/quote";
import { createClient } from "@/lib/supabase/server";

export async function createProject(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const websiteUrl = normalizeUrl(String(formData.get("website_url") || ""));
  const businessName = String(formData.get("business_name") || "");
  const industry = String(formData.get("industry") || "");
  const goal = String(formData.get("goal") || "");

  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      website_url: websiteUrl,
      business_name: businessName || null,
      industry: industry || null,
      goal: goal || null,
      status: "submitted"
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect("/new-project?error=Impossibile creare il progetto");
  }

  revalidatePath("/dashboard");
  redirect(`/project/${data.id}`);
}

export async function selectProposal(formData: FormData) {
  const supabase = await createClient();
  const projectId = String(formData.get("project_id") || "");
  const proposalId = String(formData.get("proposal_id") || "");

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  const { data: proposal } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", proposalId)
    .eq("project_id", projectId)
    .single();

  if (!project || !proposal) {
    redirect(`/project/${projectId}?error=Proposta non trovata`);
  }

  await supabase.from("proposals").update({ is_selected: false }).eq("project_id", projectId);
  await supabase.from("proposals").update({ is_selected: true }).eq("id", proposalId);

  const quote = buildQuote({ project, proposal });
  const { data: newQuote } = await supabase
    .from("quotes")
    .insert({
      project_id: projectId,
      proposal_id: proposalId,
      price: quote.price,
      currency: quote.currency,
      scope: quote.scope,
      timeline: quote.timeline,
      status: "generated"
    })
    .select("id")
    .single();

  await supabase
    .from("projects")
    .update({ status: "quote_generated", updated_at: new Date().toISOString() })
    .eq("id", projectId);

  revalidatePath(`/project/${projectId}`);
  redirect(newQuote ? `/project/${projectId}/quote/${newQuote.id}` : `/project/${projectId}`);
}

export async function confirmQuote(formData: FormData) {
  const supabase = await createClient();
  const projectId = String(formData.get("project_id") || "");
  const quoteId = String(formData.get("quote_id") || "");

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    redirect("/dashboard");
  }

  await supabase
    .from("quotes")
    .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
    .eq("id", quoteId)
    .eq("project_id", projectId);

  await supabase
    .from("projects")
    .update({ status: "quote_confirmed", updated_at: new Date().toISOString() })
    .eq("id", projectId);

  await supabase.from("notifications").insert({
    project_id: projectId,
    type: "quote_confirmed",
    status: "pending"
  });

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
