import { NextResponse } from "next/server";
import { generatePreviewImage } from "@/lib/ai";
import { getCurrentUser } from "@/lib/auth";
import { hasDatabaseEnv, query } from "@/lib/db";

export const maxDuration = 60;

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!hasDatabaseEnv()) {
      return NextResponse.json({ error: "Database non configurato" }, { status: 500 });
    }

    const { id } = await context.params;
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const [project] = await query<{ id: string; business_name: string | null }>(
      "select id, business_name from projects where id = $1 and user_id = $2 limit 1",
      [id, user.id]
    );

    if (!project) {
      return NextResponse.json({ error: "Progetto non trovato" }, { status: 404 });
    }

    const proposals = await query<{
      id: string;
      title: string;
      description: string;
      homepage_structure: unknown;
      palette: unknown;
      copy: unknown;
    }>("select id, title, description, homepage_structure, palette, copy from proposals where project_id = $1 order by variant asc limit 2", [id]);

    if (!proposals.length) {
      return NextResponse.json({ error: "Nessuna proposta trovata" }, { status: 404 });
    }

    const first = proposals[0];
    const copy = isRecord(first.copy) ? first.copy : {};
    const palette = Array.isArray(first.palette) && first.palette.length >= 3
      ? first.palette as string[]
      : ["#111827", "#f5f0e8", "#e85d4f"];
    const sections = Array.isArray(first.homepage_structure) ? first.homepage_structure as string[] : [];

    const image = await generatePreviewImage({
      name: project.business_name || "Brand",
      title: String(copy.hero_title || first.title),
      subtitle: String(copy.hero_subtitle || first.description),
      cta: String(copy.cta || "Contattaci"),
      palette,
      sections
    });

    if (!image) {
      return NextResponse.json({ error: "Generazione immagine non riuscita" }, { status: 500 });
    }

    for (const proposal of proposals) {
      await query(
        "update proposals set preview_data = preview_data || jsonb_build_object('image', $2::text) where id = $1",
        [proposal.id, image]
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("generate-image failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Errore generazione immagine" },
      { status: 500 }
    );
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
