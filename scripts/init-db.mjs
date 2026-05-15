import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

await loadEnvFile(".env.local");
await loadEnvFile(".env.production.local");

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;

if (!databaseUrl) {
  console.error("Missing DATABASE_URL, POSTGRES_URL, or POSTGRES_PRISMA_URL");
  process.exit(1);
}

const sql = neon(databaseUrl);
const schema = await readFile(new URL("../neon/schema.sql", import.meta.url), "utf8");
const statements = schema
  .split(";")
  .map((statement) => statement.trim())
  .filter(Boolean);

for (const statement of statements) {
  await sql.query(statement);
}

console.log("Neon schema ready.");

async function loadEnvFile(path) {
  try {
    const content = await readFile(new URL(`../${path}`, import.meta.url), "utf8");

    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const separator = trimmed.indexOf("=");

      if (separator === -1) {
        continue;
      }

      const key = trimmed.slice(0, separator).trim();
      const value = trimmed.slice(separator + 1).trim();

      if (key && value && !process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // Env file is optional.
  }
}
