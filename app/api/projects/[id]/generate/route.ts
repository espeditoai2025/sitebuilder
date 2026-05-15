import { NextResponse } from "next/server";
import { generateProjectIdeas } from "@/lib/ai";
import { getCurrentUser } from "@/lib/auth";
import { hasDatabaseEnv, query } from "@/lib/db";
import { extractSiteContent } from "@/lib/site-analysis";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!hasDatabaseEnv()) {
    return NextResponse.json({ error: "Neon database is not configured" }, { status: 500 });
  }

  const { id } = await context.params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [project] = await query<{
    id: string;
    website_url: string;
    business_name: string | null;
    industry: string | null;
    goal: string | null;
  }>("select * from projects where id = $1 and user_id = $2 limit 1", [id, user.id]);

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  await query("update projects set status = 'analyzing', updated_at = now() where id = $1", [id]);

  const html = await fetchWebsite(project.website_url);
  const content = extractSiteContent(html);

  await query("update projects set status = 'generating_proposals', updated_at = now() where id = $1", [id]);

  const generated = await generateProjectIdeas({
    websiteUrl: project.website_url,
    businessName: project.business_name,
    industry: project.industry,
    goal: project.goal,
    content
  });

  await query(
    `insert into site_analyses
     (project_id, raw_content, summary, detected_style, detected_colors, detected_structure)
     values ($1, $2, $3, $4::jsonb, $5::jsonb, $6::jsonb)`,
    [
      id,
      content.rawText,
      generated.analysis.summary,
      JSON.stringify(generated.analysis.detected_style),
      JSON.stringify(generated.analysis.detected_colors),
      JSON.stringify(generated.analysis.detected_structure)
    ]
  );

  for (const proposal of generated.proposals) {
    await query(
      `insert into proposals
       (project_id, variant, title, description, homepage_structure, visual_style, palette, copy, preview_data)
       values ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb, $8::jsonb, $9::jsonb)`,
      [
        id,
        proposal.variant,
        proposal.title,
        proposal.description,
        JSON.stringify(proposal.homepage_structure),
        JSON.stringify(proposal.visual_style),
        JSON.stringify(proposal.palette),
        JSON.stringify(proposal.copy),
        JSON.stringify(proposal.preview_data)
      ]
    );
  }

  await query("update projects set status = 'proposals_ready', updated_at = now() where id = $1", [id]);

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
