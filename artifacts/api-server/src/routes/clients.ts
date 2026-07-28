import { Router, type IRouter } from "express";
import { eq, like, and } from "drizzle-orm";
import { db, clientsTable, territoriesTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/clients", async (req, res): Promise<void> => {
  const { search, territory } = req.query as Record<string, string>;

  const conditions = [];
  if (search) conditions.push(like(clientsTable.name, `%${search}%`));
  if (territory) conditions.push(like(territoriesTable.name, `%${territory}%`));

  const clients = await db
    .select({
      id: clientsTable.id,
      name: clientsTable.name,
      billingName: clientsTable.billingName,
      email: clientsTable.email,
      contactNo: clientsTable.contactNo,
      city: clientsTable.city,
      territoryId: clientsTable.territoryId,
      territoryName: territoriesTable.name,
      createdAt: clientsTable.createdAt,
    })
    .from(clientsTable)
    .leftJoin(territoriesTable, eq(clientsTable.territoryId, territoriesTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(clientsTable.name);

  res.json(clients);
});

router.post("/clients", async (req, res): Promise<void> => {
  const { name, billingName, email, contactNo, city, territoryId } = req.body;
  if (!name) {
    res.status(400).json({ error: "name is required" });
    return;
  }
  const [client] = await db
    .insert(clientsTable)
    .values({ name, billingName, email, contactNo, city, territoryId: territoryId || null })
    .returning();

  const [result] = await db
    .select({
      id: clientsTable.id,
      name: clientsTable.name,
      billingName: clientsTable.billingName,
      email: clientsTable.email,
      contactNo: clientsTable.contactNo,
      city: clientsTable.city,
      territoryId: clientsTable.territoryId,
      territoryName: territoriesTable.name,
      createdAt: clientsTable.createdAt,
    })
    .from(clientsTable)
    .leftJoin(territoriesTable, eq(clientsTable.territoryId, territoriesTable.id))
    .where(eq(clientsTable.id, client.id));

  res.status(201).json(result);
});

router.get("/clients/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const [client] = await db
    .select({
      id: clientsTable.id,
      name: clientsTable.name,
      billingName: clientsTable.billingName,
      email: clientsTable.email,
      contactNo: clientsTable.contactNo,
      city: clientsTable.city,
      territoryId: clientsTable.territoryId,
      territoryName: territoriesTable.name,
      createdAt: clientsTable.createdAt,
    })
    .from(clientsTable)
    .leftJoin(territoriesTable, eq(clientsTable.territoryId, territoriesTable.id))
    .where(eq(clientsTable.id, id));

  if (!client) {
    res.status(404).json({ error: "Client not found" });
    return;
  }
  res.json(client);
});

router.put("/clients/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const { name, billingName, email, contactNo, city, territoryId } = req.body;

  const [updated] = await db
    .update(clientsTable)
    .set({ name, billingName, email, contactNo, city, territoryId: territoryId || null })
    .where(eq(clientsTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Client not found" });
    return;
  }

  const [result] = await db
    .select({
      id: clientsTable.id,
      name: clientsTable.name,
      billingName: clientsTable.billingName,
      email: clientsTable.email,
      contactNo: clientsTable.contactNo,
      city: clientsTable.city,
      territoryId: clientsTable.territoryId,
      territoryName: territoriesTable.name,
      createdAt: clientsTable.createdAt,
    })
    .from(clientsTable)
    .leftJoin(territoriesTable, eq(clientsTable.territoryId, territoriesTable.id))
    .where(eq(clientsTable.id, id));

  res.json(result);
});

router.delete("/clients/:id", async (req, res): Promise<void> => {
  const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  await db.delete(clientsTable).where(eq(clientsTable.id, id));
  res.sendStatus(204);
});

export default router;
