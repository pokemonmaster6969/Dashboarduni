const Database = require("../../node_modules/.pnpm/better-sqlite3@11.10.0/node_modules/better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "../../sqlite.db");
const db = new Database(dbPath);

console.log("==========================================================");
console.log("  COMPREHENSIVE MULTI-TEAM DATA & OPERATIONAL INSIGHTS");
console.log("==========================================================\n");

// 1. BIOINFORMATICS TEAM METRICS
console.log("----------------------------------------------------------");
console.log("  1. BIOINFORMATICS TEAM INSIGHTS (With Analysis Projects)");
console.log("----------------------------------------------------------");
const bioProjects = db.prepare(`
  SELECT 
    COUNT(*) as totalBioProjects,
    SUM(no_of_samples) as totalBioSamples,
    SUM(total_gb) as totalBioGb,
    AVG(total_gb / NULLIF(no_of_samples, 0)) as avgGbPerSample
  FROM projects 
  WHERE LOWER(with_analysis) LIKE '%with%' AND LOWER(with_analysis) NOT LIKE '%without%'
`).get();
console.log(`- Total Bioinformatic Projects: ${bioProjects.totalBioProjects}`);
console.log(`- Total Bioinformatic Samples: ${bioProjects.totalBioSamples}`);
console.log(`- Total Data Output Analyzed: ${bioProjects.totalBioGb ? bioProjects.totalBioGb.toFixed(1) : 0} GB`);
console.log(`- Average GB Per Sample: ${bioProjects.avgGbPerSample ? bioProjects.avgGbPerSample.toFixed(2) : 0} GB/sample`);

const topBioServices = db.prepare(`
  SELECT s.name, COUNT(p.id) as cnt, SUM(p.no_of_samples) as samples, SUM(p.total_gb) as gb
  FROM projects p
  JOIN services s ON p.service_id = s.id
  WHERE LOWER(p.with_analysis) LIKE '%with%' AND LOWER(p.with_analysis) NOT LIKE '%without%'
  GROUP BY s.name
  ORDER BY cnt DESC
  LIMIT 5
`).all();
console.log("\nTop Services Demanding Bioinformatic Analysis:");
topBioServices.forEach((s, i) => console.log(`  ${i+1}. ${s.name}: ${s.cnt} projects | ${s.samples} samples | ${s.gb ? s.gb.toFixed(1) : 0} GB`));

const bioScientists = db.prepare(`
  SELECT sc.name, COUNT(p.id) as cnt, SUM(p.no_of_samples) as samples, SUM(p.total_gb) as gb
  FROM projects p
  JOIN scientists sc ON p.scientist_id = sc.id
  WHERE LOWER(p.with_analysis) LIKE '%with%' AND LOWER(p.with_analysis) NOT LIKE '%without%'
  GROUP BY sc.name
  ORDER BY cnt DESC
  LIMIT 5
`).all();
console.log("\nTop Bioinformatic Workload Scientists:");
bioScientists.forEach((s, i) => console.log(`  ${i+1}. ${s.name}: ${s.cnt} bio projects | ${s.samples} samples | ${s.gb ? s.gb.toFixed(1) : 0} GB`));

// 2. WET LAB TEAM METRICS
console.log("\n----------------------------------------------------------");
console.log("  2. WET LAB TEAM INSIGHTS (Sequencing-Only / Raw Data)");
console.log("----------------------------------------------------------");
const wetLabProjects = db.prepare(`
  SELECT 
    COUNT(*) as totalWetLabProjects,
    SUM(no_of_samples) as totalWetLabSamples,
    SUM(total_gb) as totalWetLabGb
  FROM projects 
  WHERE LOWER(with_analysis) LIKE '%without%'
`).get();
console.log(`- Sequencing-Only Projects (Without Analysis): ${wetLabProjects.totalWetLabProjects}`);
console.log(`- Wet Lab Samples Volume: ${wetLabProjects.totalWetLabSamples} samples`);
console.log(`- Wet Lab Data Output: ${wetLabProjects.totalWetLabGb ? wetLabProjects.totalWetLabGb.toFixed(1) : 0} GB`);

const qcStats = db.prepare(`
  SELECT 
    SUM(qc_pass) as totalPass,
    SUM(qc_fail) as totalFail,
    AVG(qc_tat_days) as avgQcTat
  FROM qc_records
`).get();
console.log(`- Lab Quality Pass Samples: ${qcStats.totalPass}`);
console.log(`- Lab Quality Fail Samples: ${qcStats.totalFail}`);
console.log(`- Lab Quality Pass Rate: ${((qcStats.totalPass / (qcStats.totalPass + qcStats.totalFail)) * 100).toFixed(1)}%`);
console.log(`- Average Lab QC TAT: ${qcStats.avgQcTat ? qcStats.avgQcTat.toFixed(1) : 0} Days`);

const sampleTypes = db.prepare(`
  SELECT sample_type, COUNT(*) as cnt, SUM(no_of_samples) as samples
  FROM projects
  WHERE sample_type IS NOT NULL AND sample_type != ''
  GROUP BY sample_type
  ORDER BY samples DESC
  LIMIT 5
`).all();
console.log("\nTop Sample Types Handled in Wet Lab:");
sampleTypes.forEach((st, i) => console.log(`  ${i+1}. ${st.sample_type}: ${st.samples} samples across ${st.cnt} projects`));

// 3. SALES & MARKETING TEAM METRICS
console.log("\n----------------------------------------------------------");
console.log("  3. SALES & MARKETING TEAM INSIGHTS");
console.log("----------------------------------------------------------");
const salesRepPerf = db.prepare(`
  SELECT 
    sp.name as salesPerson,
    t.name as territory,
    COUNT(p.id) as projectCount,
    SUM(p.no_of_samples) as totalSamples,
    SUM(p.total_project_cost) as totalRevenue
  FROM projects p
  LEFT JOIN sales_persons sp ON p.sales_person_id = sp.id
  LEFT JOIN territories t ON p.territory_id = t.id
  GROUP BY sp.name, t.name
  ORDER BY totalRevenue DESC
`).all();
console.log("Top Sales Representatives Performance:");
salesRepPerf.slice(0, 5).forEach((sr, i) => console.log(`  ${i+1}. ${sr.salesPerson || 'Unassigned'} (${sr.territory || 'N/A'}): ₹${(sr.totalRevenue/100000).toFixed(2)} Lakhs | ${sr.projectCount} projects | ${sr.totalSamples} samples`));

const territoryPerf = db.prepare(`
  SELECT 
    t.name as territory,
    COUNT(DISTINCT p.client_id) as clientCount,
    COUNT(p.id) as projectCount,
    SUM(p.no_of_samples) as totalSamples,
    SUM(p.total_project_cost) as revenue
  FROM projects p
  JOIN territories t ON p.territory_id = t.id
  GROUP BY t.name
  ORDER BY revenue DESC
`).all();
console.log("\nTerritory Performance Breakdown:");
territoryPerf.forEach((t, i) => console.log(`  ${i+1}. ${t.territory}: ₹${(t.revenue/100000).toFixed(2)} Lakhs | ${t.clientCount} clients | ${t.projectCount} projects | ${t.totalSamples} samples`));

const topClientsByRevenue = db.prepare(`
  SELECT 
    c.name as clientName,
    COUNT(p.id) as projects,
    SUM(p.no_of_samples) as samples,
    SUM(p.total_project_cost) as revenue
  FROM projects p
  JOIN clients c ON p.client_id = c.id
  GROUP BY c.name
  ORDER BY revenue DESC
  LIMIT 5
`).all();
console.log("\nTop 5 Revenue-Generating Clients:");
topClientsByRevenue.forEach((c, i) => console.log(`  ${i+1}. ${c.clientName}: ₹${(c.revenue/100000).toFixed(2)} Lakhs (${c.projects} projects, ${c.samples} samples)`));

db.close();
