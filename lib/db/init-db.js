
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sql } from 'drizzle-orm';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../sqlite.db');
const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

// Create tables using raw SQL
const createTablesSQL = `
CREATE TABLE IF NOT EXISTS territories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS sales_persons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  territory_id INTEGER,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (territory_id) REFERENCES territories(id)
);

CREATE TABLE IF NOT EXISTS scientists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  designation TEXT,
  email TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  service_head TEXT,
  category TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  billing_name TEXT,
  email TEXT,
  contact_no TEXT,
  city TEXT,
  territory_id INTEGER,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (territory_id) REFERENCES territories(id)
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_code TEXT NOT NULL UNIQUE,
  date TEXT NOT NULL,
  month TEXT,
  lab_submission_date TEXT,
  scientist_id INTEGER,
  client_id INTEGER,
  billing_client_id INTEGER,
  service_id INTEGER,
  sample_type TEXT,
  with_analysis TEXT,
  no_of_samples INTEGER,
  data_requirement TEXT,
  gb_per_sample REAL,
  total_gb REAL,
  rate_per_sample REAL,
  total_amount REAL,
  gst REAL,
  total_project_cost REAL,
  quotation_no TEXT,
  sales_person_id INTEGER,
  territory_id INTEGER,
  city TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  remark TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (scientist_id) REFERENCES scientists(id),
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (billing_client_id) REFERENCES clients(id),
  FOREIGN KEY (service_id) REFERENCES services(id),
  FOREIGN KEY (sales_person_id) REFERENCES sales_persons(id),
  FOREIGN KEY (territory_id) REFERENCES territories(id)
);

CREATE TABLE IF NOT EXISTS qc_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL UNIQUE,
  qc_pass INTEGER,
  qc_fail INTEGER,
  qc_report_date TEXT,
  qc_tat_days INTEGER,
  qc_tat_status TEXT,
  run_no TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS data_deliveries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL UNIQUE,
  raw_data_sent_date TEXT,
  final_data_date TEXT,
  raw_data_days INTEGER,
  final_data_days INTEGER,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  invoice_no TEXT,
  invoice_date TEXT,
  qc_pass_samples INTEGER,
  subtotal REAL,
  gst REAL,
  total_amount REAL,
  invoice_tat_days INTEGER,
  payment_status TEXT NOT NULL DEFAULT 'Pending',
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  invoice_id INTEGER,
  received_amount REAL,
  remaining_amount REAL,
  payment_received_date TEXT,
  notes TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);
`;

sqlite.exec(createTablesSQL);
console.log('Database initialized successfully!');
