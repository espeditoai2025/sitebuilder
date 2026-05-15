import { neon } from "@neondatabase/serverless";

export function getDatabaseUrl() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || "";
}

export function hasDatabaseEnv() {
  return Boolean(getDatabaseUrl());
}

export function getSql() {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    throw new Error("Neon database environment variable is missing");
  }

  return neon(databaseUrl);
}

export async function query<T>(text: string, params: unknown[] = []) {
  const sql = getSql();
  const rows = await sql.query(text, params);
  return rows as T[];
}
