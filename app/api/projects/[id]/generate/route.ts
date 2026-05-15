import { NextResponse } from "next/server";
import { generateProjectIdeas } from "@/lib/ai";
import { extractSiteContent } from "@/lib/site-analysis";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  await supabase
    .from("projects")
    .update({ status: "analyzing", updated_at: new Date().toISOString() })
    .eq("id", id);

  const html = await fetchWebsite(project.website_url);
  const content = extractSiteContent(html);

  await supabase
    .from("projects")
    .update({ status: "generating_proposals", updated_at: new Date().toISOString() })
    .eq("id", id);

  const generated = await generateProjectIdeas({
    websiteUrl: project.website_url,
    businessName: project.business_name,
    industry: project.industry,
    goal: project.goal,
    content
  });

  await supabase.from("site_analyses").insert({
    project_id: id,
    raw_content: content.rawText,
    summary: generated.analysis.summary,
    detected_style: generated.analysis.detected_style,
    detected_colors: generated.analysis.detected_colors,
    detected_structure: generated.analysis.detected_structure
  });

  await supabase.from("proposals").insert(
    generated.proposals.map((proposal) => ({
      project_id: id,
      variant: proposal.variant,
      title: proposal.title,
      description: proposal.description,
      homepage_structure: proposal.homepage_structure,
      visual_style: proposal.visual_style,
      palette: proposal.palette,
      copy: proposal.copy,
      preview_data: proposal.preview_data
    }))
  );

  await supabase
    .from("projects")
    .update({ status: "proposals_ready", updated_at: new Date().toISOString() })
    .eq("id", id);

  return NextResponse.json({ ok: true });
}

async function fetchWebsite(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "SiteBuilderAI/0.1"
      }
    });

    if (!response.ok) {
      return "";
    }

    return await response.text();
  } catch {
    return "";
  } finally {
    clearTimeout(timeout);
  }
}
