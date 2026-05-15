import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;

if (!databaseUrl) {
  console.error("Missing DATABASE_URL, POSTGRES_URL, or POSTGRES_PRISMA_URL");
  process.exit(1);
}

const sql = neon(databaseUrl);
const schema = await readFile(new URL("../neon/schema.sql", import.meta.url), "utf8");

await sql.query(schema);
console.log("Neon schema ready.");
