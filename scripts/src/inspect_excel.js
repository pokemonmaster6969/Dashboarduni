import XLSX from 'xlsx';
import path from 'path';

const file = 'c:/Users/pooja/Documents/Reportal/Reference-Master-Plan/MASTER-MIS-UNIPATH-2025-26.xlsx';
const workbook = XLSX.readFile(file);
console.log('Sheet names:', workbook.SheetNames);
for (const sheetName of workbook.SheetNames) {
  const sheet = workbook.Sheets[sheetName];
  const range = sheet['!ref'];
  console.log(`Sheet "${sheetName}" range:`, range);
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  console.log(`Sheet "${sheetName}" rows:`, data.length);
  if (data.length > 0) {
    console.log(`First row:`, data[0]);
    if (data[1]) console.log(`Second/Data row:`, data[1]);
  }
}
