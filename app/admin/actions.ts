"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { query } from "@/lib/db";

export async function updateQuotePackage(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const basePrice = Number(formData.get("base_price") || 0);
  const variantBDelta = Number(formData.get("variant_b_delta") || 0);
  const extraSectionPrice = Number(formData.get("extra_section_price") || 0);
  const includedSectionsThreshold = Number(formData.get("included_sections_threshold") || 6);
  const currency = String(formData.get("currency") || "EUR").trim().toUpperCase();
  const timeline = String(formData.get("timeline") || "").trim();
  const scope = String(formData.get("scope") || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
  const active = formData.get("active") === "on";

  if (!id || !name || !basePrice || !timeline) {
    redirect("/admin?error=Compila nome, prezzo e tempistiche");
  }

  await query(
    `update quote_packages
     set name = $2,
         description = $3,
         base_price = $4,
         variant_b_delta = $5,
         extra_section_price = $6,
         included_sections_threshold = $7,
         currency = $8,
         timeline = $9,
         scope = $10::jsonb,
         active = $11,
         updated_at = now()
     where id = $1`,
    [
      id,
      name,
      description || null,
      basePrice,
      variantBDelta,
      extraSectionPrice,
      includedSectionsThreshold,
      currency,
      timeline,
      JSON.stringify(scope),
      active
    ]
  );

  revalidatePath("/admin");
  redirect("/admin?updated=1");
}

export async function promoteUserToAdmin(formData: FormData) {
  await requireAdmin();

  const id = String(formData.get("id") || "");

  if (id) {
    await query("update app_users set role = 'admin' where id = $1", [id]);
  }

  revalidatePath("/admin");
  redirect("/admin?updated=1");
}
