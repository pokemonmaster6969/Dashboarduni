/**
 * Seed script — populates the database with real data from the Excel file
 * Run: npx tsx src/seed.ts
 */
import {
  db,
  territoriesTable,
  salesPersonsTable,
  clientsTable,
  servicesTable,
  scientistsTable,
  projectsTable,
  qcRecordsTable,
  dataDeliveriesTable,
  invoicesTable,
  paymentsTable,
} from "@workspace/db";
import { logger } from "./lib/logger";
import XLSX from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function excelSerialToDate(serial: number | null | undefined): string | null {
  if (serial == null || typeof serial !== "number" || isNaN(serial)) return null;
  // Excel serial date to JS date
  const utcDays = Math.floor(serial - 25569);
  const utcValue = utcDays * 86400 * 1000;
  const dateInfo = new Date(utcValue);
  const year = dateInfo.getFullYear();
  const month = String(dateInfo.getMonth() + 1).padStart(2, "0");
  const day = String(dateInfo.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toNumber(value: any): number | null {
  if (value == null) return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
}

function toString(value: any): string | null {
  if (value == null) return null;
  return String(value).trim() || null;
}

async function seed() {
  logger.info("Seeding database…");

  // Clear existing tables
  await db.delete(paymentsTable);
  await db.delete(invoicesTable);
  await db.delete(dataDeliveriesTable);
  await db.delete(qcRecordsTable);
  await db.delete(projectsTable);
  await db.delete(clientsTable);
  await db.delete(servicesTable);
  await db.delete(scientistsTable);
  await db.delete(salesPersonsTable);
  await db.delete(territoriesTable);

  // Parse Excel file
  const excelPath = path.join(__dirname, "../../../MASTER-MIS-UNIPATH-2025-26.xlsx");
  const workbook = XLSX.readFile(excelPath);
  const dataSheet = workbook.Sheets["Data"];
  const rawRows = XLSX.utils.sheet_to_json(dataSheet, { header: 1 }) as any[][];
  const headers = rawRows[0] as string[];
  const dataRows = rawRows.slice(1).filter((row) => row.length > 0);

  logger.info({ count: dataRows.length }, "Excel rows loaded");

  // Collect unique entities
  const territoriesSet = new Set<string>();
  const salesPersonsSet = new Map<string, string>(); // name -> territory
  const scientistsSet = new Set<string>();
  const servicesSet = new Map<string, string>(); // name -> serviceHead
  const clientsSet = new Map<string, { city: string | null; billingName: string | null; territory: string | null }>();

  for (const row of dataRows) {
    const territory = toString(row[headers.indexOf("TERRITORY NAME")]);
    const salesPerson = toString(row[headers.indexOf("SALES PERSON")]);
    const scientist = toString(row[headers.indexOf("SCIENTIST NAME")]);
    const serviceName = toString(row[headers.indexOf("SERVICE NAME")]);
    const serviceHead = toString(row[headers.indexOf("SERVICE HEAD")]);
    const institute = toString(row[headers.indexOf("INSTITUTE")]);
    const billing = toString(row[headers.indexOf("BILLING")]);
    const city = toString(row[headers.indexOf("CITY")]);

    if (territory) territoriesSet.add(territory);
    if (salesPerson && territory) salesPersonsSet.set(salesPerson, territory);
    if (scientist) scientistsSet.add(scientist);
    if (serviceName) servicesSet.set(serviceName, serviceHead || "");
    if (institute) clientsSet.set(institute, { city, billingName: billing, territory });
  }

  // Insert territories
  const territories: { id: number; name: string }[] = [];
  for (const name of territoriesSet) {
    const [t] = await db
      .insert(territoriesTable)
      .values({ name })
      .returning();
    if (t) territories.push(t);
  }
  const tMap = new Map(territories.map((t) => [t.name, t.id]));
  logger.info({ count: territories.length }, "Territories seeded");

  // Insert sales persons
  const salesPersons: { id: number; name: string }[] = [];
  for (const [name, territory] of salesPersonsSet) {
    const [s] = await db
      .insert(salesPersonsTable)
      .values({ name, territoryId: tMap.get(territory) ?? null })
      .returning();
    if (s) salesPersons.push(s);
  }
  const spMap = new Map(salesPersons.map((s) => [s.name, s.id]));
  logger.info({ count: salesPersons.length }, "Sales persons seeded");

  // Insert scientists
  const scientists: { id: number; name: string }[] = [];
  for (const name of scientistsSet) {
    const [s] = await db
      .insert(scientistsTable)
      .values({ name, designation: null, email: null })
      .returning();
    if (s) scientists.push(s);
  }
  const scMap = new Map(scientists.map((s) => [s.name, s.id]));
  logger.info({ count: scientists.length }, "Scientists seeded");

  // Insert services
  const services: { id: number; name: string }[] = [];
  for (const [name, serviceHead] of servicesSet) {
    const [s] = await db
      .insert(servicesTable)
      .values({ name, serviceHead: serviceHead || null, category: null })
      .returning();
    if (s) services.push(s);
  }
  const svMap = new Map(services.map((s) => [s.name, s.id]));
  logger.info({ count: services.length }, "Services seeded");

  // Insert clients
  const clients: { id: number; name: string }[] = [];
  for (const [name, { city, billingName, territory }] of clientsSet) {
    const [c] = await db
      .insert(clientsTable)
      .values({ name, city, billingName, territoryId: territory ? (tMap.get(territory) ?? null) : null, email: null, contactNo: null })
      .returning();
    if (c) clients.push(c);
  }
  const clMap = new Map(clients.map((c) => [c.name, c.id]));
  logger.info({ count: clients.length }, "Clients seeded");

  const insertedProjects: { id: number; projectCode: string }[] = [];
  const insertedInvoices: { id: number; projectId: number }[] = [];
  const seenCodes = new Set<string>();

  for (const row of dataRows) {
    try {
      const baseCode = toString(row[headers.indexOf("PROJECT ID")]);
      if (!baseCode) continue;

      let projectCode = baseCode;
      let dupCount = 1;
      while (seenCodes.has(projectCode)) {
        dupCount++;
        projectCode = `${baseCode}_${dupCount}`;
      }
      seenCodes.add(projectCode);

      const dateSerial = toNumber(row[headers.indexOf("DATE")]);
      const date = excelSerialToDate(dateSerial);
      const month = toString(row[headers.indexOf("Month ")]);
      const labSubmissionDateSerial = toNumber(row[headers.indexOf("Lab Process Submission Date")]);
      const labSubmissionDate = excelSerialToDate(labSubmissionDateSerial);
      const scientistName = toString(row[headers.indexOf("SCIENTIST NAME")]);
      const institute = toString(row[headers.indexOf("INSTITUTE")]);
      const billing = toString(row[headers.indexOf("BILLING")]);
      const serviceName = toString(row[headers.indexOf("SERVICE NAME")]);
      const sampleType = toString(row[headers.indexOf("Sample Type ")]);
      const withAnalysis = toString(row[headers.indexOf("With/Without Analysis")]);
      const noOfSamples = toNumber(row[headers.indexOf("NO OF SAMPLE")]);
      const gbPerSample = toNumber(row[headers.indexOf("GB DATA OUTPUT")]);
      const totalGb = toNumber(row[headers.indexOf("TOTAL GB DATA OUTPUT")]);
      const ratePerSample = toNumber(row[headers.indexOf("RATE PER SAMPLE")]);
      const totalAmount = toNumber(row[headers.indexOf("TOTAL")]);
      const gst = toNumber(row[headers.indexOf("GST")]);
      const totalProjectCost = toNumber(row[headers.indexOf("TOTAL PROJECT COST")]);
      const quotationNo = toString(row[headers.indexOf("QUOTATION NO./GEM NO.")]);
      const salesPersonName = toString(row[headers.indexOf("SALES PERSON")]);
      const territoryName = toString(row[headers.indexOf("TERRITORY NAME")]);
      const city = toString(row[headers.indexOf("CITY")]);
      const qcPass = toNumber(row[headers.indexOf("QC Pass ")]);
      const qcFail = toNumber(row[headers.indexOf("QC Fail")]);
      const qcReportDateSerial = toNumber(row[headers.indexOf("QC Report Received Date")]);
      const qcReportDate = excelSerialToDate(qcReportDateSerial);
      const qcTatDays = toNumber(row[headers.indexOf("QC TAT Status")]);
      const runNo = toString(row[headers.indexOf("Run No ")]);
      const rawDataSentDateSerial = toNumber(row[headers.indexOf("Raw Data Sent Date ")]);
      const rawDataSentDate = excelSerialToDate(rawDataSentDateSerial);
      const finalDataDateSerial = toNumber(row[headers.indexOf("Final Data Received Date ")]);
      const finalDataDate = excelSerialToDate(finalDataDateSerial);
      const invoiceNo = toString(row[headers.indexOf("INVOICE NO.")]);
      const invoiceDateSerial = toNumber(row[headers.indexOf("INVOICE DATE .")]);
      const invoiceDate = excelSerialToDate(invoiceDateSerial);
      const remark = toString(row[headers.indexOf("Remark")]);
      const qcPassSamples = toNumber(row[headers.indexOf("(QC Pass samples) TOTAL")]);
      const invoiceTatDays = toNumber(row[headers.indexOf("Invoice TAT")]);
      const receivedPayment = toNumber(row[headers.indexOf("Received Payment")]);
      const remainingPayment = toNumber(row[headers.indexOf("Remaining payment")]);
      const paymentReceivedDateSerial = toNumber(row[headers.indexOf(" Payment Received Date ")]);
      const paymentReceivedDate = excelSerialToDate(paymentReceivedDateSerial);

      // Insert project
      const remarkRaw = toString(row[headers.indexOf("Remark")]);
      let status = "In Progress";
      if (remarkRaw) {
        if (remarkRaw.toLowerCase().includes("closure")) {
          status = "Completed";
        } else if (remarkRaw.toLowerCase().includes("cancel")) {
          status = "Cancelled";
        } else {
          status = remarkRaw;
        }
      }

      const [project] = await db
        .insert(projectsTable)
        .values({
          projectCode,
          date: date || "2025-01-01",
          month,
          labSubmissionDate,
          scientistId: scientistName ? scMap.get(scientistName) ?? null : null,
          clientId: institute ? clMap.get(institute) ?? null : null,
          billingClientId: billing ? clMap.get(billing) ?? null : null,
          serviceId: serviceName ? svMap.get(serviceName) ?? null : null,
          sampleType,
          withAnalysis,
          noOfSamples,
          dataRequirement: toString(row[headers.indexOf("Data Requirement:")]),
          gbPerSample,
          totalGb,
          ratePerSample,
          totalAmount,
          gst,
          totalProjectCost,
          quotationNo,
          salesPersonId: salesPersonName ? spMap.get(salesPersonName) ?? null : null,
          territoryId: territoryName ? tMap.get(territoryName) ?? null : null,
          city,
          status,
          remark,
        })
        .returning();
      if (!project) continue;
      insertedProjects.push(project);

      // Insert QC record
      await db.insert(qcRecordsTable).values({
        projectId: project.id,
        qcPass,
        qcFail,
        qcReportDate,
        qcTatDays,
        qcTatStatus: null,
        runNo,
      });

      // Insert data delivery
      await db.insert(dataDeliveriesTable).values({
        projectId: project.id,
        rawDataSentDate,
        finalDataDate,
        rawDataDays: null,
        finalDataDays: null,
      });

      // Insert invoice if invoice no exists
      if (invoiceNo) {
        const [inv] = await db.insert(invoicesTable).values({
          projectId: project.id,
          invoiceNo,
          invoiceDate,
          qcPassSamples,
          subtotal: totalAmount,
          gst,
          totalAmount: totalProjectCost,
          invoiceTatDays,
          paymentStatus: (receivedPayment && receivedPayment > 0 && remainingPayment && remainingPayment === 0)
            ? "Paid"
            : (receivedPayment && receivedPayment > 0)
            ? "Partial"
            : "Pending",
        }).returning();
        if (inv) insertedInvoices.push(inv);
      }

      // Insert payment if received payment exists
      if (receivedPayment != null && receivedPayment > 0) {
        const invForPayment = insertedInvoices.find(i => i.projectId === project.id);
        await db.insert(paymentsTable).values({
          projectId: project.id,
          invoiceId: invForPayment?.id ?? null,
          receivedAmount: receivedPayment,
          remainingAmount: remainingPayment,
          paymentReceivedDate,
          notes: remark,
        });
      }

    } catch (err) {
      logger.error(err, "Error processing row");
    }
  }

  logger.info({ count: insertedProjects.length }, "Projects seeded");
  logger.info({ count: insertedInvoices.length }, "Invoices seeded");
  logger.info("Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  logger.error(err, "Seed failed");
  process.exit(1);
});
