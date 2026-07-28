import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("Running Drizzle-based database seeder...");
try {
  execSync('npx tsx artifacts/api-server/src/seed.ts', {
    cwd: __dirname,
    stdio: 'inherit',
    env: process.env
  });
  console.log("Seeding completed successfully!");
} catch (err) {
  console.error("Seeding failed:", err.message);
  process.exit(1);
}
