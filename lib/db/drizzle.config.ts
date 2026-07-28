import { defineConfig } from "drizzle-kit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Manually load .env from workspace root
try {
  const envPath = path.resolve(__dirname, "../../.env");
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
  console.warn("Could not load .env file:", e.message);
}

export default defineConfig({
  schema: [
    "./src/schema/territories.ts",
    "./src/schema/salesPersons.ts",
    "./src/schema/scientists.ts",
    "./src/schema/services.ts",
    "./src/schema/clients.ts",
    "./src/schema/projects.ts",
    "./src/schema/qcRecords.ts",
    "./src/schema/dataDeliveries.ts",
    "./src/schema/invoices.ts",
    "./src/schema/payments.ts",
    "./src/schema/attachments.ts",
  ],
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/unipath_mis",
  },
});
