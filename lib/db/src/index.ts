import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Manually load .env from workspace root
try {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const envPath = path.resolve(currentDir, "../../../.env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    for (const line of envContent.split("\n")) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = match[2] || "";
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1);
        } else if (val.startsWith("'") && val.endsWith("'")) {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val.trim();
      }
    }
  }
} catch (e) {
  console.warn("Could not load .env file:", e instanceof Error ? e.message : String(e));
}

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/unipath_mis";

export const pool = new pg.Pool({
  connectionString,
});

export const db = drizzle(pool, { schema });

export * from "./schema";
export type { Pool } from "pg";
