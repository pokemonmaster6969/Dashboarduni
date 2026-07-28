import { Router, type IRouter } from "express";
import { eq, like, and, desc, count, gte, lte, SQL } from "drizzle-orm";
import { db, invoicesTable, projectsTable, clientsTable } from "@workspace/db";

const router: IRouter = Router();

const invoiceSelect = {
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
  paymentStatus: invoicesTable.paymentStatus,
  invoiceFileId: invoicesTable.invoiceFileId,
  createdAt: invoicesTable.createdAt,
  updatedAt: invoicesTable.updatedAt,
};

router.get("/invoices", async (req, res): Promise<void> => {
  const q = req.query as Record<string, string>;
  const page = Math.max(1, parseInt(q.page || "1", 10));
  const pageSize = Math.min(200, Math.max(1, parseInt(q.pageSize || "50", 10)));
  const offset = (page - 1) * pageSize;

  const conditions: SQL[] = [];
  if (q.search) conditions.push(like(invoicesTable.invoiceNo, `%${q.search}%`));
  if (q.projectId) conditions.push(eq(invoicesTable.projectId, parseInt(q.projectId, 10)));
  if (q.clientId) conditions.push(eq(clientsTable.id, parseInt(q.clientId, 10)));
  if (q.paymentStatus) conditions.push(eq(invoicesTable.paymentStatus, q.paymentStatus));
  if (q.dateFrom) conditions.push(gte(invoicesTable.invoiceDate, q.dateFrom));
  if (q.dateTo) conditions.push(lte(invoicesTable.invoiceDate, q.dateTo));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ total }] = await db
    .select({ total: count() })
    .from(invoicesTable)
    .leftJoin(projectsTable, eq(invoicesTable.projectId, projectsTable.id))
    .leftJoin(clientsTable, eq(projectsTable.clientId, clientsTable.id))
    .where(where);

  const data = await db
    .select(invoiceSelect)
    .from(invoicesTable)
    .leftJoin(projectsTable, eq(invoicesTable.projectId, projectsTable.id))
    .leftJoin(clientsTable, eq(projectsTable.clientId, clientsTable.id))
    .where(where)
    .orderBy(desc(invoicesTable.invoiceDate))
    .limit(pageSize)
    .offset(offset);

  res.json({ data, total, page, pageSize });
});

router.post("/invoices", async (req, res): Promise<void> => {
  const { projectId, invoiceNo, invoiceDate, qcPassSamples, subtotal, gst, totalAmount, invoiceTatDays, paymentStatus, invoiceFileId } = req.body;
  if (!projectId) { res.status(400).json({ error: "projectId is required" }); return; }

  const [inv] = await db.insert(invoicesTable).values({
    projectId,
    invoiceNo,
    invoiceDate,
    qcPassSamples,
    subtotal: subtotal?.toString(),
    gst: gst?.toString(),
    totalAmount: totalAmount?.toString(),
    invoiceTatDays,
    paymentStatus: paymentStatus || "Pending",
    invoiceFileId: invoiceFileId || null,
  }).returning();

  const [result] = await db
    .select(invoiceSelect)
    .from(invoicesTable)
    .leftJoin(projectsTable, eq(invoicesTable.projectId, projectsTable.id))
    .leftJoin(clientsTable, eq(projectsTable.clientId, clientsTable.id))
    .where(eq(invoicesTable.id, inv.id));

  res.status(201).json(result);
});

router.get("/invoices/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [result] = await db
    .select(invoiceSelect)
    .from(invoicesTable)
    .leftJoin(projectsTable, eq(invoicesTable.projectId, projectsTable.id))
    .leftJoin(clientsTable, eq(projectsTable.clientId, clientsTable.id))
    .where(eq(invoicesTable.id, id));
  if (!result) { res.status(404).json({ error: "Not found" }); return; }
  res.json(result);
});

router.put("/invoices/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { invoiceNo, invoiceDate, qcPassSamples, subtotal, gst, totalAmount, invoiceTatDays, paymentStatus, invoiceFileId } = req.body;

  await db.update(invoicesTable).set({
    invoiceNo, invoiceDate, qcPassSamples,
    subtotal: subtotal?.toString(),
    gst: gst?.toString(),
    totalAmount: totalAmount?.toString(),
    invoiceTatDays, paymentStatus,
    invoiceFileId: invoiceFileId !== undefined ? (invoiceFileId || null) : undefined,
  }).where(eq(invoicesTable.id, id));

  const [result] = await db
    .select(invoiceSelect)
    .from(invoicesTable)
    .leftJoin(projectsTable, eq(invoicesTable.projectId, projectsTable.id))
    .leftJoin(clientsTable, eq(projectsTable.clientId, clientsTable.id))
    .where(eq(invoicesTable.id, id));
  if (!result) { res.status(404).json({ error: "Not found" }); return; }
  res.json(result);
});

router.delete("/invoices/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  await db.delete(invoicesTable).where(eq(invoicesTable.id, id));
  res.sendStatus(204);
});

export default router;
