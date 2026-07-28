const XLSX = require("xlsx");
const path = require("path");

const excelPath = path.join(__dirname, "../../MASTER-MIS-UNIPATH-2025-26.xlsx");
const workbook = XLSX.readFile(excelPath);
const dataSheet = workbook.Sheets["Data"];
const rawRows = XLSX.utils.sheet_to_json(dataSheet, { header: 1 });
const headers = rawRows[0];
const remarkIdx = headers.indexOf("Remark");

const remarks = new Map();

rawRows.slice(1).forEach((row) => {
  const remark = row[remarkIdx];
  const str = remark != null ? String(remark).trim() : "(empty)";
  remarks.set(str, (remarks.get(str) || 0) + 1);
});

console.log("=== EXCEL REMARK COLUMN DISTRIBUTION ===");
console.log(Object.fromEntries(remarks));
