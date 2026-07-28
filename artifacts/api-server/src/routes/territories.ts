import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, territoriesTable, salesPersonsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/territories", async (_req, res): Promise<void> => {
  const territories = await db.select().from(territoriesTable).orderBy(territoriesTable.name);
  res.json(territories);
});

router.post("/territories", async (req, res): Promise<void> => {
  const { name } = req.body;
  if (!name) { res.status(400).json({ error: "name is required" }); return; }
  const [territory] = await db.insert(territoriesTable).values({ name }).returning();
  res.status(201).json(territory);
});

router.put("/territories/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { name } = req.body;
  const [updated] = await db.update(territoriesTable).set({ name }).where(eq(territoriesTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

router.delete("/territories/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  await db.delete(territoriesTable).where(eq(territoriesTable.id, id));
  res.sendStatus(204);
});

// Sales Persons
router.get("/sales-persons", async (_req, res): Promise<void> => {
  const results = await db
    .select({
      id: salesPersonsTable.id,
      name: salesPersonsTable.name,
      territoryId: salesPersonsTable.territoryId,
      territoryName: territoriesTable.name,
      createdAt: salesPersonsTable.createdAt,
    })
    .from(salesPersonsTable)
    .leftJoin(territoriesTable, eq(salesPersonsTable.territoryId, territoriesTable.id))
    .orderBy(salesPersonsTable.name);
  res.json(results);
});

router.post("/sales-persons", async (req, res): Promise<void> => {
  const { name, territoryId } = req.body;
  if (!name) { res.status(400).json({ error: "name is required" }); return; }
  const [sp] = await db.insert(salesPersonsTable).values({ name, territoryId: territoryId || null }).returning();
  const [result] = await db
    .select({
      id: salesPersonsTable.id,
      name: salesPersonsTable.name,
      territoryId: salesPersonsTable.territoryId,
      territoryName: territoriesTable.name,
      createdAt: salesPersonsTable.createdAt,
    })
    .from(salesPersonsTable)
    .leftJoin(territoriesTable, eq(salesPersonsTable.territoryId, territoriesTable.id))
    .where(eq(salesPersonsTable.id, sp.id));
  res.status(201).json(result);
});

router.put("/sales-persons/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { name, territoryId } = req.body;
  await db.update(salesPersonsTable).set({ name, territoryId: territoryId || null }).where(eq(salesPersonsTable.id, id));
  const [result] = await db
    .select({
      id: salesPersonsTable.id,
      name: salesPersonsTable.name,
      territoryId: salesPersonsTable.territoryId,
      territoryName: territoriesTable.name,
      createdAt: salesPersonsTable.createdAt,
    })
    .from(salesPersonsTable)
    .leftJoin(territoriesTable, eq(salesPersonsTable.territoryId, territoriesTable.id))
    .where(eq(salesPersonsTable.id, id));
  if (!result) { res.status(404).json({ error: "Not found" }); return; }
  res.json(result);
});

router.delete("/sales-persons/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  await db.delete(salesPersonsTable).where(eq(salesPersonsTable.id, id));
  res.sendStatus(204);
});

export default router;
