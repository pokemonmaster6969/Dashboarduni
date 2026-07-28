import { Router, type IRouter } from "express";
import { sql, and, gte, lte, eq, desc, isNull, isNotNull, gt } from "drizzle-orm";
import {
  db,
  projectsTable,
  clientsTable,
  servicesTable,
  territoriesTable,
  qcRecordsTable,
  dataDeliveriesTable,
  invoicesTable,
  paymentsTable,
  scientistsTable,
} from "@workspace/db";

const router: IRouter = Router();

function dateFilter(q: Record<string, string>) {
  const conds = [];
  if (q.dateFrom) conds.push(gte(projectsTable.date, q.dateFrom));
  if (q.dateTo) conds.push(lte(projectsTable.date, q.dateTo));
  return conds;
}

// ─── DASHBOARD KPIs ─────────────────────────────────────────────────────────
router.get("/analytics/dashboard", async (req, res): Promise<void> => {
  const q = req.query as Record<string, string>;
  const dateConds = dateFilter(q);
  const where = dateConds.length > 0 ? and(...dateConds) : undefined;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

  const [projectStats] = await db
    .select({
      total: sql<number>`count(*)`,
      active: sql<number>`sum(case when ${projectsTable.status} = 'Active' then 1 else 0 end)`,
      completed: sql<number>`sum(case when ${projectsTable.status} = 'Completed' then 1 else 0 end)`,
      cancelled: sql<number>`sum(case when ${projectsTable.status} = 'Cancelled' then 1 else 0 end)`,
      totalSamples: sql<number>`coalesce(sum(${projectsTable.noOfSamples}), 0)`,
      totalRevenue: sql<number>`coalesce(sum(${projectsTable.totalProjectCost}), 0)`,
    })
    .from(projectsTable)
    .where(where);

  const [monthStats] = await db
    .select({
      projectsThisMonth: sql<number>`count(*)`,
      revenueThisMonth: sql<number>`coalesce(sum(${projectsTable.totalProjectCost}), 0)`,
    })
    .from(projectsTable)
    .where(and(gte(projectsTable.date, monthStart), lte(projectsTable.date, monthEnd)));

  const [paymentStats] = await db
    .select({
      totalReceived: sql<number>`coalesce(sum(${paymentsTable.receivedAmount}), 0)`,
      totalRemaining: sql<number>`coalesce(sum(${paymentsTable.remainingAmount}), 0)`,
    })
    .from(paymentsTable);

  const [qcStats] = await db
    .select({
      totalPass: sql<number>`coalesce(sum(${qcRecordsTable.qcPass}), 0)`,
      totalFail: sql<number>`coalesce(sum(${qcRecordsTable.qcFail}), 0)`,
      avgTat: sql<number>`avg(${qcRecordsTable.qcTatDays})`,
    })
    .from(qcRecordsTable);

  const qcPassRate =
    qcStats.totalPass + qcStats.totalFail > 0
      ? (qcStats.totalPass / (qcStats.totalPass + qcStats.totalFail)) * 100
      : null;

  // Pipeline counts
  const [pendingQcRow] = await db
    .select({ cnt: sql<number>`count(*)` })
    .from(projectsTable)
    .leftJoin(qcRecordsTable, eq(qcRecordsTable.projectId, projectsTable.id))
    .where(and(eq(projectsTable.status, "Active"), isNull(qcRecordsTable.id)));

  const [pendingAnalysisRow] = await db
    .select({ cnt: sql<number>`count(*)` })
    .from(projectsTable)
    .leftJoin(dataDeliveriesTable, eq(dataDeliveriesTable.projectId, projectsTable.id))
    .where(and(eq(projectsTable.status, "Active"), isNull(dataDeliveriesTable.rawDataSentDate)));

  const [pendingReportRow] = await db
    .select({ cnt: sql<number>`count(*)` })
    .from(projectsTable)
    .leftJoin(dataDeliveriesTable, eq(dataDeliveriesTable.projectId, projectsTable.id))
    .where(and(eq(projectsTable.status, "Active"), isNull(dataDeliveriesTable.finalDataDate)));

  // Top entities
  const [topServiceRow] = await db
    .select({ name: servicesTable.name, cnt: sql<number>`count(*)` })
    .from(projectsTable)
    .leftJoin(servicesTable, eq(projectsTable.serviceId, servicesTable.id))
    .where(where)
    .groupBy(servicesTable.name)
    .orderBy(desc(sql`count(*)`))
    .limit(1);

  const [topClientRow] = await db
    .select({ name: clientsTable.name, cnt: sql<number>`count(*)` })
    .from(projectsTable)
    .leftJoin(clientsTable, eq(projectsTable.clientId, clientsTable.id))
    .where(where)
    .groupBy(clientsTable.name)
    .orderBy(desc(sql`count(*)`))
    .limit(1);

  const [topTerritoryRow] = await db
    .select({ name: territoriesTable.name, cnt: sql<number>`count(*)` })
    .from(projectsTable)
    .leftJoin(territoriesTable, eq(projectsTable.territoryId, territoriesTable.id))
    .where(where)
    .groupBy(territoriesTable.name)
    .orderBy(desc(sql`count(*)`))
    .limit(1);

  res.json({
    totalProjects: projectStats.total ?? 0,
    activeProjects: projectStats.active ?? 0,
    completedProjects: projectStats.completed ?? 0,
    cancelledProjects: projectStats.cancelled ?? 0,
    totalRevenue: Number(projectStats.totalRevenue ?? 0),
    receivedPayments: Number(paymentStats.totalReceived ?? 0),
    pendingPayments: Number(paymentStats.totalRemaining ?? 0),
    totalSamples: projectStats.totalSamples ?? 0,
    avgTatDays: qcStats.avgTat ? Number(qcStats.avgTat) : null,
    projectsThisMonth: monthStats.projectsThisMonth ?? 0,
    revenueThisMonth: Number(monthStats.revenueThisMonth ?? 0),
    qcPassRate: qcPassRate ? Number(qcPassRate.toFixed(1)) : null,
    pendingQc: pendingQcRow?.cnt ?? 0,
    pendingAnalysis: pendingAnalysisRow?.cnt ?? 0,
    pendingReport: pendingReportRow?.cnt ?? 0,
    topService: topServiceRow?.name ?? null,
    topClient: topClientRow?.name ?? null,
    topTerritory: topTerritoryRow?.name ?? null,
  });
});

// ─── REVENUE ANALYTICS ───────────────────────────────────────────────────────
router.get("/analytics/revenue", async (req, res): Promise<void> => {
  const q = req.query as Record<string, string>;
  const groupBy = q.groupBy || "month";

  const conds = [];
  if (q.dateFrom) conds.push(gte(projectsTable.date, q.dateFrom));
  if (q.dateTo) conds.push(lte(projectsTable.date, q.dateTo));
  if (q.serviceId) conds.push(eq(projectsTable.serviceId, parseInt(q.serviceId, 10)));
  if (q.territoryId) conds.push(eq(projectsTable.territoryId, parseInt(q.territoryId, 10)));
  if (q.clientId) conds.push(eq(projectsTable.clientId, parseInt(q.clientId, 10)));
  const where = conds.length > 0 ? and(...conds) : undefined;

  let periodExpr: ReturnType<typeof sql>;
  if (groupBy === "year") {
    periodExpr = sql`substr(${projectsTable.date}, 1, 4)`;
  } else if (groupBy === "quarter") {
    periodExpr = sql`substr(${projectsTable.date}, 1, 4) || '-Q' || ((cast(substr(${projectsTable.date}, 6, 2) as integer) + 2) / 3)`;
  } else {
    periodExpr = sql`substr(${projectsTable.date}, 1, 7)`;
  }

  const data = await db
    .select({
      period: periodExpr.as("period"),
      revenue: sql<number>`coalesce(sum(${projectsTable.totalProjectCost}), 0)`,
      projects: sql<number>`count(*)`,
      samples: sql<number>`coalesce(sum(${projectsTable.noOfSamples}), 0)`,
    })
    .from(projectsTable)
    .where(where)
    .groupBy(periodExpr)
    .orderBy(periodExpr);

  // Join payment data by period
  const paymentData = await db
    .select({
      period: periodExpr.as("period"),
      received: sql<number>`coalesce(sum(${paymentsTable.receivedAmount}), 0)`,
      pending: sql<number>`coalesce(sum(${paymentsTable.remainingAmount}), 0)`,
    })
    .from(paymentsTable)
    .leftJoin(projectsTable, eq(paymentsTable.projectId, projectsTable.id))
    .where(where)
    .groupBy(periodExpr)
    .orderBy(periodExpr);

  const paymentMap = new Map(paymentData.map((p) => [p.period, p]));

  const enriched = data.map((d) => ({
    period: d.period as string,
    revenue: Number(d.revenue),
    projects: d.projects,
    samples: d.samples,
    received: Number(paymentMap.get(d.period as string)?.received ?? 0),
    pending: Number(paymentMap.get(d.period as string)?.pending ?? 0),
  }));

  const totalRevenue = enriched.reduce((s, d) => s + d.revenue, 0);
  const totalReceived = enriched.reduce((s, d) => s + d.received, 0);
  const totalPending = enriched.reduce((s, d) => s + d.pending, 0);

  res.json({ data: enriched, totalRevenue, totalReceived, totalPending });
});

// ─── PROJECT ANALYTICS ───────────────────────────────────────────────────────
router.get("/analytics/projects", async (req, res): Promise<void> => {
  const q = req.query as Record<string, string>;
  const groupBy = q.groupBy || "month";

  const conds = [];
  if (q.dateFrom) conds.push(gte(projectsTable.date, q.dateFrom));
  if (q.dateTo) conds.push(lte(projectsTable.date, q.dateTo));
  if (q.serviceId) conds.push(eq(projectsTable.serviceId, parseInt(q.serviceId, 10)));
  if (q.territoryId) conds.push(eq(projectsTable.territoryId, parseInt(q.territoryId, 10)));
  const where = conds.length > 0 ? and(...conds) : undefined;

  let periodExpr: ReturnType<typeof sql>;
  if (groupBy === "year") {
    periodExpr = sql`substr(${projectsTable.date}, 1, 4)`;
  } else if (groupBy === "service") {
    periodExpr = sql`coalesce(${servicesTable.name}, 'Unknown')`;
  } else if (groupBy === "territory") {
    periodExpr = sql`coalesce(${territoriesTable.name}, 'Unknown')`;
  } else if (groupBy === "scientist") {
    periodExpr = sql`coalesce(${scientistsTable.name}, 'Unknown')`;
  } else if (groupBy === "quarter") {
    periodExpr = sql`substr(${projectsTable.date}, 1, 4) || '-Q' || ((cast(substr(${projectsTable.date}, 6, 2) as integer) + 2) / 3)`;
  } else {
    periodExpr = sql`substr(${projectsTable.date}, 1, 7)`;
  }

  const data = await db
    .select({
      period: periodExpr.as("period"),
      total: sql<number>`count(*)`,
      completed: sql<number>`sum(case when ${projectsTable.status} = 'Completed' then 1 else 0 end)`,
      active: sql<number>`sum(case when ${projectsTable.status} = 'Active' then 1 else 0 end)`,
      cancelled: sql<number>`sum(case when ${projectsTable.status} = 'Cancelled' then 1 else 0 end)`,
    })
    .from(projectsTable)
    .leftJoin(servicesTable, eq(projectsTable.serviceId, servicesTable.id))
    .leftJoin(territoriesTable, eq(projectsTable.territoryId, territoriesTable.id))
    .leftJoin(scientistsTable, eq(projectsTable.scientistId, scientistsTable.id))
    .where(where)
    .groupBy(periodExpr)
    .orderBy(periodExpr);

  const statusBreakdown = await db
    .select({
      status: projectsTable.status,
      count: sql<number>`count(*)`,
    })
    .from(projectsTable)
    .where(where)
    .groupBy(projectsTable.status);

  const enriched = data.map((d) => ({
    period: d.period as string,
    label: d.period as string,
    total: d.total ?? 0,
    completed: d.completed ?? 0,
    active: d.active ?? 0,
    cancelled: d.cancelled ?? 0,
  }));

  res.json({ data: enriched, statusBreakdown });
});

// ─── SERVICE ANALYTICS ───────────────────────────────────────────────────────
router.get("/analytics/services", async (req, res): Promise<void> => {
  const q = req.query as Record<string, string>;
  const conds = [];
  if (q.dateFrom) conds.push(gte(projectsTable.date, q.dateFrom));
  if (q.dateTo) conds.push(lte(projectsTable.date, q.dateTo));
  const where = conds.length > 0 ? and(...conds) : undefined;

  const data = await db
    .select({
      serviceId: servicesTable.id,
      serviceName: servicesTable.name,
      serviceHead: servicesTable.serviceHead,
      projectCount: sql<number>`count(${projectsTable.id})`,
      totalRevenue: sql<number>`coalesce(sum(${projectsTable.totalProjectCost}), 0)`,
      totalSamples: sql<number>`coalesce(sum(${projectsTable.noOfSamples}), 0)`,
      avgTatDays: sql<number>`avg(${qcRecordsTable.qcTatDays})`,
    })
    .from(servicesTable)
    .leftJoin(projectsTable, eq(projectsTable.serviceId, servicesTable.id))
    .leftJoin(qcRecordsTable, eq(qcRecordsTable.projectId, projectsTable.id))
    .where(where)
    .groupBy(servicesTable.id, servicesTable.name, servicesTable.serviceHead)
    .orderBy(desc(sql`sum(${projectsTable.totalProjectCost})`));

  res.json(
    data.map((d) => ({
      ...d,
      totalRevenue: Number(d.totalRevenue),
      avgTatDays: d.avgTatDays ? Number(Number(d.avgTatDays).toFixed(1)) : null,
    }))
  );
});

// ─── CLIENT ANALYTICS ────────────────────────────────────────────────────────
router.get("/analytics/clients", async (req, res): Promise<void> => {
  const q = req.query as Record<string, string>;
  const limit = Math.min(100, parseInt(q.limit || "20", 10));
  const conds = [];
  if (q.dateFrom) conds.push(gte(projectsTable.date, q.dateFrom));
  if (q.dateTo) conds.push(lte(projectsTable.date, q.dateTo));
  const where = conds.length > 0 ? and(...conds) : undefined;

  const data = await db
    .select({
      clientId: clientsTable.id,
      clientName: clientsTable.name,
      projectCount: sql<number>`count(distinct ${projectsTable.id})`,
      totalRevenue: sql<number>`coalesce(sum(${projectsTable.totalProjectCost}), 0)`,
      totalSamples: sql<number>`coalesce(sum(${projectsTable.noOfSamples}), 0)`,
      receivedAmount: sql<number>`coalesce(sum(${paymentsTable.receivedAmount}), 0)`,
      pendingAmount: sql<number>`coalesce(sum(${paymentsTable.remainingAmount}), 0)`,
      lastProjectDate: sql<string>`max(${projectsTable.date})`,
      territory: territoriesTable.name,
    })
    .from(clientsTable)
    .leftJoin(projectsTable, eq(projectsTable.clientId, clientsTable.id))
    .leftJoin(paymentsTable, eq(paymentsTable.projectId, projectsTable.id))
    .leftJoin(territoriesTable, eq(clientsTable.territoryId, territoriesTable.id))
    .where(where)
    .groupBy(clientsTable.id, clientsTable.name, territoriesTable.name)
    .orderBy(desc(sql`sum(${projectsTable.totalProjectCost})`))
    .limit(limit);

  res.json(
    data.map((d) => ({
      ...d,
      totalRevenue: Number(d.totalRevenue),
      receivedAmount: Number(d.receivedAmount),
      pendingAmount: Number(d.pendingAmount),
    }))
  );
});

// ─── TERRITORY ANALYTICS ─────────────────────────────────────────────────────
router.get("/analytics/territories", async (req, res): Promise<void> => {
  const q = req.query as Record<string, string>;
  const conds = [];
  if (q.dateFrom) conds.push(gte(projectsTable.date, q.dateFrom));
  if (q.dateTo) conds.push(lte(projectsTable.date, q.dateTo));
  const where = conds.length > 0 ? and(...conds) : undefined;

  const data = await db
    .select({
      territoryId: territoriesTable.id,
      territoryName: territoriesTable.name,
      projectCount: sql<number>`count(distinct ${projectsTable.id})`,
      totalRevenue: sql<number>`coalesce(sum(${projectsTable.totalProjectCost}), 0)`,
      totalSamples: sql<number>`coalesce(sum(${projectsTable.noOfSamples}), 0)`,
      clientCount: sql<number>`count(distinct ${projectsTable.clientId})`,
    })
    .from(territoriesTable)
    .leftJoin(projectsTable, eq(projectsTable.territoryId, territoriesTable.id))
    .where(where)
    .groupBy(territoriesTable.id, territoriesTable.name)
    .orderBy(desc(sql`sum(${projectsTable.totalProjectCost})`));

  res.json(
    data.map((d) => ({
      ...d,
      totalRevenue: Number(d.totalRevenue),
    }))
  );
});

// ─── TAT ANALYTICS ───────────────────────────────────────────────────────────
router.get("/analytics/tat", async (req, res): Promise<void> => {
  const q = req.query as Record<string, string>;
  const conds = [];
  if (q.dateFrom) conds.push(gte(projectsTable.date, q.dateFrom));
  if (q.dateTo) conds.push(lte(projectsTable.date, q.dateTo));
  if (q.serviceId) conds.push(eq(projectsTable.serviceId, parseInt(q.serviceId, 10)));
  const where = conds.length > 0 ? and(...conds) : undefined;

  const [overall] = await db
    .select({
      avgQcTat: sql<number>`avg(${qcRecordsTable.qcTatDays})`,
      avgDeliveryTat: sql<number>`avg(${dataDeliveriesTable.rawDataDays})`,
      avgInvoiceTat: sql<number>`avg(${invoicesTable.invoiceTatDays})`,
    })
    .from(projectsTable)
    .leftJoin(qcRecordsTable, eq(qcRecordsTable.projectId, projectsTable.id))
    .leftJoin(dataDeliveriesTable, eq(dataDeliveriesTable.projectId, projectsTable.id))
    .leftJoin(invoicesTable, eq(invoicesTable.projectId, projectsTable.id))
    .where(where);

  const byService = await db
    .select({
      service: servicesTable.name,
      avgQcTat: sql<number>`avg(${qcRecordsTable.qcTatDays})`,
      avgDeliveryTat: sql<number>`avg(${dataDeliveriesTable.rawDataDays})`,
      projectCount: sql<number>`count(distinct ${projectsTable.id})`,
    })
    .from(projectsTable)
    .leftJoin(servicesTable, eq(projectsTable.serviceId, servicesTable.id))
    .leftJoin(qcRecordsTable, eq(qcRecordsTable.projectId, projectsTable.id))
    .leftJoin(dataDeliveriesTable, eq(dataDeliveriesTable.projectId, projectsTable.id))
    .where(where)
    .groupBy(servicesTable.name)
    .orderBy(desc(sql`count(distinct ${projectsTable.id})`))
    .limit(10);

  res.json({
    overall: {
      avgQcTat: overall?.avgQcTat ? Number(Number(overall.avgQcTat).toFixed(1)) : null,
      avgDeliveryTat: overall?.avgDeliveryTat ? Number(Number(overall.avgDeliveryTat).toFixed(1)) : null,
      avgInvoiceTat: overall?.avgInvoiceTat ? Number(Number(overall.avgInvoiceTat).toFixed(1)) : null,
    },
    byService: byService.map((s) => ({
      service: s.service ?? "Unknown",
      avgQcTat: s.avgQcTat ? Number(Number(s.avgQcTat).toFixed(1)) : null,
      avgDeliveryTat: s.avgDeliveryTat ? Number(Number(s.avgDeliveryTat).toFixed(1)) : null,
      projectCount: s.projectCount,
    })),
  });
});

// ─── PAYMENT ANALYTICS ───────────────────────────────────────────────────────
router.get("/analytics/payments", async (req, res): Promise<void> => {
  const q = req.query as Record<string, string>;
  const conds = [];
  if (q.dateFrom) conds.push(gte(projectsTable.date, q.dateFrom));
  if (q.dateTo) conds.push(lte(projectsTable.date, q.dateTo));
  if (q.clientId) conds.push(eq(projectsTable.clientId, parseInt(q.clientId, 10)));
  const where = conds.length > 0 ? and(...conds) : undefined;

  const [totals] = await db
    .select({
      totalInvoiced: sql<number>`coalesce(sum(${invoicesTable.totalAmount}), 0)`,
      totalReceived: sql<number>`coalesce(sum(${paymentsTable.receivedAmount}), 0)`,
      totalPending: sql<number>`coalesce(sum(${paymentsTable.remainingAmount}), 0)`,
    })
    .from(projectsTable)
    .leftJoin(invoicesTable, eq(invoicesTable.projectId, projectsTable.id))
    .leftJoin(paymentsTable, eq(paymentsTable.projectId, projectsTable.id))
    .where(where);

  const totalInvoiced = Number(totals.totalInvoiced);
  const totalReceived = Number(totals.totalReceived);
  const totalPending = Number(totals.totalPending);
  const collectionRate = totalInvoiced > 0 ? (totalReceived / totalInvoiced) * 100 : 0;

  const pendingByClient = await db
    .select({
      clientId: clientsTable.id,
      clientName: clientsTable.name,
      pending: sql<number>`coalesce(sum(${paymentsTable.remainingAmount}), 0)`,
      invoiced: sql<number>`coalesce(sum(${invoicesTable.totalAmount}), 0)`,
    })
    .from(clientsTable)
    .leftJoin(projectsTable, eq(projectsTable.clientId, clientsTable.id))
    .leftJoin(paymentsTable, eq(paymentsTable.projectId, projectsTable.id))
    .leftJoin(invoicesTable, eq(invoicesTable.projectId, projectsTable.id))
    .where(where)
    .groupBy(clientsTable.id, clientsTable.name)
    .having(sql`coalesce(sum(${paymentsTable.remainingAmount}), 0) > 0`)
    .orderBy(desc(sql`sum(${paymentsTable.remainingAmount})`))
    .limit(20);

  res.json({
    totalInvoiced,
    totalReceived,
    totalPending,
    collectionRate: Number(collectionRate.toFixed(1)),
    pendingByClient: pendingByClient.map((c) => ({
      ...c,
      pending: Number(c.pending),
      invoiced: Number(c.invoiced),
    })),
  });
});

// ─── PIPELINE STATUS ─────────────────────────────────────────────────────────
router.get("/analytics/pipeline", async (req, res): Promise<void> => {
  const q = req.query as Record<string, string>;
  const conds = [];
  if (q.dateFrom) conds.push(gte(projectsTable.date, q.dateFrom));
  if (q.dateTo) conds.push(lte(projectsTable.date, q.dateTo));
  const where = conds.length > 0 ? and(...conds) : undefined;

  const [submitted] = await db
    .select({
      count: sql<number>`count(distinct ${projectsTable.id})`,
      value: sql<number>`coalesce(sum(${projectsTable.totalProjectCost}), 0)`,
    })
    .from(projectsTable)
    .where(where);

  const [qcDone] = await db
    .select({
      count: sql<number>`count(distinct ${projectsTable.id})`,
      value: sql<number>`coalesce(sum(${projectsTable.totalProjectCost}), 0)`,
    })
    .from(projectsTable)
    .innerJoin(qcRecordsTable, eq(qcRecordsTable.projectId, projectsTable.id))
    .where(and(where, isNotNull(qcRecordsTable.qcReportDate)));

  const [dataDelivered] = await db
    .select({
      count: sql<number>`count(distinct ${projectsTable.id})`,
      value: sql<number>`coalesce(sum(${projectsTable.totalProjectCost}), 0)`,
    })
    .from(projectsTable)
    .innerJoin(dataDeliveriesTable, eq(dataDeliveriesTable.projectId, projectsTable.id))
    .where(and(where, isNotNull(dataDeliveriesTable.rawDataSentDate)));

  const [invoiced] = await db
    .select({
      count: sql<number>`count(distinct ${projectsTable.id})`,
      value: sql<number>`coalesce(sum(${invoicesTable.totalAmount}), 0)`,
    })
    .from(projectsTable)
    .innerJoin(invoicesTable, eq(invoicesTable.projectId, projectsTable.id))
    .where(where);

  const [paid] = await db
    .select({
      count: sql<number>`count(distinct ${projectsTable.id})`,
      value: sql<number>`coalesce(sum(${paymentsTable.receivedAmount}), 0)`,
    })
    .from(projectsTable)
    .innerJoin(paymentsTable, eq(paymentsTable.projectId, projectsTable.id))
    .where(and(where, gt(sql<number>`${paymentsTable.receivedAmount}`, sql<number>`0`)));

  res.json({
    stages: [
      { stage: "Submitted", count: submitted.count, value: Number(submitted.value) },
      { stage: "QC Done", count: qcDone.count, value: Number(qcDone.value) },
      { stage: "Data Delivered", count: dataDelivered.count, value: Number(dataDelivered.value) },
      { stage: "Invoiced", count: invoiced.count, value: Number(invoiced.value) },
      { stage: "Paid", count: paid.count, value: Number(paid.value) },
    ],
  });
});

export default router;
