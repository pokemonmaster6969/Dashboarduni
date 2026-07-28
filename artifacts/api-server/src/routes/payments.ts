import { Router, type IRouter } from "express";
import { eq, and, desc, count, gte, lte, SQL } from "drizzle-orm";
import { db, paymentsTable, projectsTable, clientsTable, invoicesTable } from "@workspace/db";

const router: IRouter = Router();

const paymentSelect = {
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
};

router.get("/payments", async (req, res): Promise<void> => {
  const q = req.query as Record<string, string>;
  const page = Math.max(1, parseInt(q.page || "1", 10));
  const pageSize = Math.min(200, Math.max(1, parseInt(q.pageSize || "50", 10)));
  const offset = (page - 1) * pageSize;

  const conditions: SQL[] = [];
  if (q.projectId) conditions.push(eq(paymentsTable.projectId, parseInt(q.projectId, 10)));
  if (q.invoiceId) conditions.push(eq(paymentsTable.invoiceId, parseInt(q.invoiceId, 10)));
  if (q.clientId) conditions.push(eq(clientsTable.id, parseInt(q.clientId, 10)));
  if (q.dateFrom) conditions.push(gte(paymentsTable.paymentReceivedDate, q.dateFrom));
  if (q.dateTo) conditions.push(lte(paymentsTable.paymentReceivedDate, q.dateTo));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ total }] = await db
    .select({ total: count() })
    .from(paymentsTable)
    .leftJoin(projectsTable, eq(paymentsTable.projectId, projectsTable.id))
    .leftJoin(clientsTable, eq(projectsTable.clientId, clientsTable.id))
    .leftJoin(invoicesTable, eq(paymentsTable.invoiceId, invoicesTable.id))
    .where(where);

  const data = await db
    .select(paymentSelect)
    .from(paymentsTable)
    .leftJoin(projectsTable, eq(paymentsTable.projectId, projectsTable.id))
    .leftJoin(clientsTable, eq(projectsTable.clientId, clientsTable.id))
    .leftJoin(invoicesTable, eq(paymentsTable.invoiceId, invoicesTable.id))
    .where(where)
    .orderBy(desc(paymentsTable.paymentReceivedDate))
    .limit(pageSize)
    .offset(offset);

  res.json({ data, total, page, pageSize });
});

router.post("/payments", async (req, res): Promise<void> => {
  const { projectId, invoiceId, receivedAmount, remainingAmount, paymentReceivedDate, notes } = req.body;
  if (!projectId) { res.status(400).json({ error: "projectId is required" }); return; }

  const [pmt] = await db.insert(paymentsTable).values({
    projectId,
    invoiceId: invoiceId || null,
    receivedAmount: receivedAmount?.toString(),
    remainingAmount: remainingAmount?.toString(),
    paymentReceivedDate,
    notes,
  }).returning();

  const [result] = await db
    .select(paymentSelect)
    .from(paymentsTable)
    .leftJoin(projectsTable, eq(paymentsTable.projectId, projectsTable.id))
    .leftJoin(clientsTable, eq(projectsTable.clientId, clientsTable.id))
    .leftJoin(invoicesTable, eq(paymentsTable.invoiceId, invoicesTable.id))
    .where(eq(paymentsTable.id, pmt.id));

  res.status(201).json(result);
});

router.put("/payments/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { invoiceId, receivedAmount, remainingAmount, paymentReceivedDate, notes } = req.body;

  await db.update(paymentsTable).set({
    invoiceId: invoiceId || null,
    receivedAmount: receivedAmount?.toString(),
    remainingAmount: remainingAmount?.toString(),
    paymentReceivedDate,
    notes,
  }).where(eq(paymentsTable.id, id));

  const [result] = await db
    .select(paymentSelect)
    .from(paymentsTable)
    .leftJoin(projectsTable, eq(paymentsTable.projectId, projectsTable.id))
    .leftJoin(clientsTable, eq(projectsTable.clientId, clientsTable.id))
    .leftJoin(invoicesTable, eq(paymentsTable.invoiceId, invoicesTable.id))
    .where(eq(paymentsTable.id, id));
  if (!result) { res.status(404).json({ error: "Not found" }); return; }
  res.json(result);
});

router.delete("/payments/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  await db.delete(paymentsTable).where(eq(paymentsTable.id, id));
  res.sendStatus(204);
});

export default router;
