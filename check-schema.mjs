
import { createClient } from '@libsql/client';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'sqlite.db');
const db = createClient({ url: `file:${dbPath}` });

const tables = await db.execute("SELECT name FROM sqlite_master WHERE type='table';");
console.log('Tables:', tables.rows);

for (const table of tables.rows) {
  const schema = await db.execute(`PRAGMA table_info(${table.name});`);
  console.log(`\nSchema for ${table.name}:`);
  console.table(schema.rows);
}

db.close();
