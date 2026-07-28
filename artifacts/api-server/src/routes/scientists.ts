import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, scientistsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/scientists", async (_req, res): Promise<void> => {
  const scientists = await db.select().from(scientistsTable).orderBy(scientistsTable.name);
  res.json(scientists);
});

router.post("/scientists", async (req, res): Promise<void> => {
  const { name, designation, email } = req.body;
  if (!name) { res.status(400).json({ error: "name is required" }); return; }
  const [scientist] = await db.insert(scientistsTable).values({ name, designation, email }).returning();
  res.status(201).json(scientist);
});

router.put("/scientists/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { name, designation, email } = req.body;
  const [updated] = await db.update(scientistsTable).set({ name, designation, email }).where(eq(scientistsTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

router.delete("/scientists/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  await db.delete(scientistsTable).where(eq(scientistsTable.id, id));
  res.sendStatus(204);
});

export default router;
