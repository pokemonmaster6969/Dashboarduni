import { Router, type IRouter } from "express";
import { eq, like, and } from "drizzle-orm";
import { db, servicesTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/services", async (req, res): Promise<void> => {
  const { search, serviceHead } = req.query as Record<string, string>;
  const conditions = [];
  if (search) conditions.push(like(servicesTable.name, `%${search}%`));
  if (serviceHead) conditions.push(like(servicesTable.serviceHead, `%${serviceHead}%`));

  const services = await db
    .select()
    .from(servicesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(servicesTable.name);
  res.json(services);
});

router.post("/services", async (req, res): Promise<void> => {
  const { name, serviceHead, category } = req.body;
  if (!name) { res.status(400).json({ error: "name is required" }); return; }
  const [service] = await db.insert(servicesTable).values({ name, serviceHead, category }).returning();
  res.status(201).json(service);
});

router.get("/services/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [service] = await db.select().from(servicesTable).where(eq(servicesTable.id, id));
  if (!service) { res.status(404).json({ error: "Service not found" }); return; }
  res.json(service);
});

router.put("/services/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { name, serviceHead, category } = req.body;
  const [updated] = await db.update(servicesTable).set({ name, serviceHead, category }).where(eq(servicesTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Service not found" }); return; }
  res.json(updated);
});

router.delete("/services/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  await db.delete(servicesTable).where(eq(servicesTable.id, id));
  res.sendStatus(204);
});

export default router;
