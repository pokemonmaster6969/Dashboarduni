import { Router, type IRouter } from "express";
import { eq, like, and, or, desc, count, SQL, gte, lte } from "drizzle-orm";
import {
  db,
  projectsTable,
  clientsTable,
  servicesTable,
  scientistsTable,
  salesPersonsTable,
  territoriesTable,
  qcRecordsTable,
  dataDeliveriesTable,
  invoicesTable,
  paymentsTable,
} from "@workspace/db";

const router: IRouter = Router();

// Build project select with joins
const projectSelect = {
  id: projectsTable.id,
  projectCode: projectsTable.projectCode,
  date: projectsTable.date,
  month: projectsTable.month,
  labSubmissionDate: projectsTable.labSubmissionDate,
  scientistId: projectsTable.scientistId,
  scientistName: scientistsTable.name,
  clientId: projectsTable.clientId,
  clientName: clientsTable.name,
  serviceId: projectsTable.serviceId,
  serviceName: servicesTable.name,
  serviceHead: servicesTable.serviceHead,
  sampleType: projectsTable.sampleType,
  withAnalysis: projectsTable.withAnalysis,
  noOfSamples: projectsTable.noOfSamples,
  dataRequirement: projectsTable.dataRequirement,
  gbPerSample: projectsTable.gbPerSample,
  totalGb: projectsTable.totalGb,
  ratePerSample: projectsTable.ratePerSample,
  totalAmount: projectsTable.totalAmount,
  gst: projectsTable.gst,
  totalProjectCost: projectsTable.totalProjectCost,
  quotationNo: projectsTable.quotationNo,
  salesPersonId: projectsTable.salesPersonId,
  salesPersonName: salesPersonsTable.name,
  territoryId: projectsTable.territoryId,
  territoryName: territoriesTable.name,
  city: projectsTable.city,
  remark: projectsTable.remark,
  runNo: qcRecordsTable.runNo,
  quotationFileId: projectsTable.quotationFileId,
  createdAt: projectsTable.createdAt,
  updatedAt: projectsTable.updatedAt,
};

router.get("/projects", async (req, res): Promise<void> => {
  const q = req.query as Record<string, string>;
  const page = Math.max(1, parseInt(q.page || "1", 10));
  const pageSize = Math.min(200, Math.max(1, parseInt(q.pageSize || "50", 10)));
  const offset = (page - 1) * pageSize;

  const conditions: SQL[] = [];
  if (q.search) {
    conditions.push(
      or(
        like(projectsTable.projectCode, `%${q.search}%`),
        like(clientsTable.name, `%${q.search}%`),
        like(servicesTable.name, `%${q.search}%`)
      ) as SQL
    );
  }
  if (q.status) conditions.push(eq(projectsTable.status, q.status));
  if (q.clientId) conditions.push(eq(projectsTable.clientId, parseInt(q.clientId, 10)));
  if (q.serviceId) conditions.push(eq(projectsTable.serviceId, parseInt(q.serviceId, 10)));
  if (q.scientistId) conditions.push(eq(projectsTable.scientistId, parseInt(q.scientistId, 10)));
  if (q.territoryId) conditions.push(eq(projectsTable.territoryId, parseInt(q.territoryId, 10)));
  if (q.salesPersonId) conditions.push(eq(projectsTable.salesPersonId, parseInt(q.salesPersonId, 10)));
  if (q.dateFrom) conditions.push(gte(projectsTable.date, q.dateFrom));
  if (q.dateTo) conditions.push(lte(projectsTable.date, q.dateTo));
  if (q.month) conditions.push(like(projectsTable.month, `%${q.month}%`));
  if (q.withAnalysis) conditions.push(like(projectsTable.withAnalysis, `%${q.withAnalysis}%`));
  if (q.runNo) conditions.push(eq(qcRecordsTable.runNo, q.runNo));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const baseQuery = db
    .select(projectSelect)
    .from(projectsTable)
    .leftJoin(scientistsTable, eq(projectsTable.scientistId, scientistsTable.id))
    .leftJoin(servicesTable, eq(projectsTable.serviceId, servicesTable.id))
    .leftJoin(clientsTable, eq(projectsTable.clientId, clientsTable.id))
    .leftJoin(salesPersonsTable, eq(projectsTable.salesPersonId, salesPersonsTable.id))
    .leftJoin(territoriesTable, eq(projectsTable.territoryId, territoriesTable.id))
    .leftJoin(qcRecordsTable, eq(projectsTable.id, qcRecordsTable.projectId));

  const [{ total }] = await db
    .select({ total: count() })
    .from(projectsTable)
    .leftJoin(scientistsTable, eq(projectsTable.scientistId, scientistsTable.id))
    .leftJoin(servicesTable, eq(projectsTable.serviceId, servicesTable.id))
    .leftJoin(clientsTable, eq(projectsTable.clientId, clientsTable.id))
    .leftJoin(salesPersonsTable, eq(projectsTable.salesPersonId, salesPersonsTable.id))
    .leftJoin(territoriesTable, eq(projectsTable.territoryId, territoriesTable.id))
    .leftJoin(qcRecordsTable, eq(projectsTable.id, qcRecordsTable.projectId))
    .where(where);

  const data = await baseQuery
    .where(where)
    .orderBy(desc(projectsTable.date))
    .limit(pageSize)
    .offset(offset);

  // Add billingClient fields (same table, different alias not possible in Drizzle easily)
  const enriched = data.map((p) => ({
    ...p,
    billingClientId: null as number | null,
    billingClientName: null as string | null,
  }));

  res.json({ data: enriched, total, page, pageSize });
});

router.post("/projects", async (req, res): Promise<void> => {
  const body = req.body;
  if (!body.projectCode || !body.date) {
    res.status(400).json({ error: "projectCode and date are required" });
    return;
  }

  const [project] = await db.insert(projectsTable).values({
    projectCode: body.projectCode,
    date: body.date,
    month: body.month,
    labSubmissionDate: body.labSubmissionDate,
    scientistId: body.scientistId || null,
    clientId: body.clientId || null,
    billingClientId: body.billingClientId || null,
    serviceId: body.serviceId || null,
    sampleType: body.sampleType,
    withAnalysis: body.withAnalysis,
    noOfSamples: body.noOfSamples,
    dataRequirement: body.dataRequirement,
    gbPerSample: body.gbPerSample?.toString(),
    totalGb: body.totalGb?.toString(),
    ratePerSample: body.ratePerSample?.toString(),
    totalAmount: body.totalAmount?.toString(),
    gst: body.gst?.toString(),
    totalProjectCost: body.totalProjectCost?.toString(),
    quotationNo: body.quotationNo,
    salesPersonId: body.salesPersonId || null,
    territoryId: body.territoryId || null,
    city: body.city,
    status: body.status || "Active",
    remark: body.remark,
    quotationFileId: body.quotationFileId || null,
  }).returning();

  const [result] = await db
    .select(projectSelect)
    .from(projectsTable)
    .leftJoin(scientistsTable, eq(projectsTable.scientistId, scientistsTable.id))
    .leftJoin(servicesTable, eq(projectsTable.serviceId, servicesTable.id))
    .leftJoin(clientsTable, eq(projectsTable.clientId, clientsTable.id))
    .leftJoin(salesPersonsTable, eq(projectsTable.salesPersonId, salesPersonsTable.id))
    .leftJoin(territoriesTable, eq(projectsTable.territoryId, territoriesTable.id))
    .leftJoin(qcRecordsTable, eq(projectsTable.id, qcRecordsTable.projectId))
    .where(eq(projectsTable.id, project.id));

  res.status(201).json({ ...result, billingClientId: null, billingClientName: null });
});

router.get("/projects/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);

  const [project] = await db
    .select(projectSelect)
    .from(projectsTable)
    .leftJoin(scientistsTable, eq(projectsTable.scientistId, scientistsTable.id))
    .leftJoin(servicesTable, eq(projectsTable.serviceId, servicesTable.id))
    .leftJoin(clientsTable, eq(projectsTable.clientId, clientsTable.id))
    .leftJoin(salesPersonsTable, eq(projectsTable.salesPersonId, salesPersonsTable.id))
    .leftJoin(territoriesTable, eq(projectsTable.territoryId, territoriesTable.id))
    .leftJoin(qcRecordsTable, eq(projectsTable.id, qcRecordsTable.projectId))
    .where(eq(projectsTable.id, id));

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const [qcRecord] = await db.select().from(qcRecordsTable).where(eq(qcRecordsTable.projectId, id));
  const [dataDelivery] = await db.select().from(dataDeliveriesTable).where(eq(dataDeliveriesTable.projectId, id));
  const invoices = await db
    .select({
      id: invoicesTable.id,
      projectId: invoicesTable.projectId,
      projectCode: projectsTable.projectCode,
      clientId: clientsTable.id,
      clientName: clientsTable.name,
      invoiceNo: invoicesTable.invoiceNo,
      invoiceDate: invoicesTable.invoiceDate,
      qcPassSamples: invoicesTable.qcPassSamples,
      subtotal: invoicesTable.subtotal,
      gst: invoicesTable.gst,
      totalAmount: invoicesTable.totalAmount,
      invoiceTatDays: invoicesTable.invoiceTatDays,
      paymentStatus: invoicesTable.paymentStatus,
      createdAt: invoicesTable.createdAt,
      updatedAt: invoicesTable.updatedAt,
    })
    .from(invoicesTable)
    .leftJoin(projectsTable, eq(invoicesTable.projectId, projectsTable.id))
    .leftJoin(clientsTable, eq(projectsTable.clientId, clientsTable.id))
    .where(eq(invoicesTable.projectId, id))
    .orderBy(desc(invoicesTable.invoiceDate));

  const payments = await db
    .select({
      id: paymentsTable.id,
      projectId: paymentsTable.projectId,
      invoiceId: paymentsTable.invoiceId,
      invoiceNo: invoicesTable.invoiceNo,
      clientId: clientsTable.id,
      clientName: clientsTable.name,
      receivedAmount: paymentsTable.receivedAmount,
      remainingAmount: paymentsTable.remainingAmount,
      paymentReceivedDate: paymentsTable.paymentReceivedDate,
      notes: paymentsTable.notes,
      createdAt: paymentsTable.createdAt,
      updatedAt: paymentsTable.updatedAt,
    })
    .from(paymentsTable)
    .leftJoin(invoicesTable, eq(paymentsTable.invoiceId, invoicesTable.id))
    .leftJoin(projectsTable, eq(paymentsTable.projectId, projectsTable.id))
    .leftJoin(clientsTable, eq(projectsTable.clientId, clientsTable.id))
    .where(eq(paymentsTable.projectId, id))
    .orderBy(desc(paymentsTable.paymentReceivedDate));

  res.json({
    ...project,
    billingClientId: null,
    billingClientName: null,
    qcRecord: qcRecord || null,
    dataDelivery: dataDelivery || null,
    invoices,
    payments,
  });
});

router.put("/projects/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const body = req.body;

  const updateData: Record<string, unknown> = {};
  const allowed = [
    "projectCode", "date", "month", "labSubmissionDate", "scientistId", "clientId",
    "billingClientId", "serviceId", "sampleType", "withAnalysis", "noOfSamples",
    "dataRequirement", "gbPerSample", "totalGb", "ratePerSample", "totalAmount",
    "gst", "totalProjectCost", "quotationNo", "salesPersonId", "territoryId",
    "city", "status", "remark", "quotationFileId"
  ];
  const numericFields = ["gbPerSample", "totalGb", "ratePerSample", "totalAmount", "gst", "totalProjectCost"];

  for (const key of allowed) {
    if (body[key] !== undefined) {
      updateData[key] = numericFields.includes(key) && body[key] != null
        ? body[key].toString()
        : (body[key] || null);
    }
  }

  const [updated] = await db.update(projectsTable).set(updateData).where(eq(projectsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }

  const [result] = await db
    .select(projectSelect)
    .from(projectsTable)
    .leftJoin(scientistsTable, eq(projectsTable.scientistId, scientistsTable.id))
    .leftJoin(servicesTable, eq(projectsTable.serviceId, servicesTable.id))
    .leftJoin(clientsTable, eq(projectsTable.clientId, clientsTable.id))
    .leftJoin(salesPersonsTable, eq(projectsTable.salesPersonId, salesPersonsTable.id))
    .leftJoin(territoriesTable, eq(projectsTable.territoryId, territoriesTable.id))
    .leftJoin(qcRecordsTable, eq(projectsTable.id, qcRecordsTable.projectId))
    .where(eq(projectsTable.id, id));

  res.json({ ...result, billingClientId: null, billingClientName: null });
});

router.delete("/projects/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  await db.delete(projectsTable).where(eq(projectsTable.id, id));
  res.sendStatus(204);
});

// QC Records
router.get("/projects/:projectId/qc", async (req, res): Promise<void> => {
  const projectId = parseInt(Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId, 10);
  const [record] = await db.select().from(qcRecordsTable).where(eq(qcRecordsTable.projectId, projectId));
  res.json(record || null);
});

router.put("/projects/:projectId/qc", async (req, res): Promise<void> => {
  const projectId = parseInt(Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId, 10);
  const { qcPass, qcFail, qcReportDate, qcTatDays, qcTatStatus, runNo } = req.body;

  const [existing] = await db.select().from(qcRecordsTable).where(eq(qcRecordsTable.projectId, projectId));

  let record;
  if (existing) {
    [record] = await db.update(qcRecordsTable)
      .set({ qcPass, qcFail, qcReportDate, qcTatDays, qcTatStatus, runNo })
      .where(eq(qcRecordsTable.projectId, projectId))
      .returning();
  } else {
    [record] = await db.insert(qcRecordsTable)
      .values({ projectId, qcPass, qcFail, qcReportDate, qcTatDays, qcTatStatus, runNo })
      .returning();
  }
  res.json(record);
});

// Data Delivery
router.get("/projects/:projectId/delivery", async (req, res): Promise<void> => {
  const projectId = parseInt(Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId, 10);
  const [record] = await db.select().from(dataDeliveriesTable).where(eq(dataDeliveriesTable.projectId, projectId));
  res.json(record || null);
});

router.put("/projects/:projectId/delivery", async (req, res): Promise<void> => {
  const projectId = parseInt(Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId, 10);
  const { rawDataSentDate, finalDataDate, rawDataDays, finalDataDays } = req.body;

  const [existing] = await db.select().from(dataDeliveriesTable).where(eq(dataDeliveriesTable.projectId, projectId));

  let record;
  if (existing) {
    [record] = await db.update(dataDeliveriesTable)
      .set({ rawDataSentDate, finalDataDate, rawDataDays, finalDataDays })
      .where(eq(dataDeliveriesTable.projectId, projectId))
      .returning();
  } else {
    [record] = await db.insert(dataDeliveriesTable)
      .values({ projectId, rawDataSentDate, finalDataDate, rawDataDays, finalDataDays })
      .returning();
  }
  res.json(record);
});

export default router;
