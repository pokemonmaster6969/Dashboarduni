import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, attachmentsTable } from "@workspace/db";

const router: IRouter = Router();

// Create a new attachment (JSON Base64 upload)
router.post("/attachments", async (req, res): Promise<void> => {
  try {
    const { fileName, mimeType, fileData } = req.body;

    if (!fileName || !mimeType || !fileData) {
      res.status(400).json({ error: "fileName, mimeType, and fileData are required" });
      return;
    }

    const [attachment] = await db
      .insert(attachmentsTable)
      .values({
        fileName,
        mimeType,
        fileData,
      })
      .returning({
        id: attachmentsTable.id,
        fileName: attachmentsTable.fileName,
        mimeType: attachmentsTable.mimeType,
        createdAt: attachmentsTable.createdAt,
      });

    res.status(201).json(attachment);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Internal Server Error" });
  }
});

// Download / View the file binary
router.get("/attachments/:id", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid attachment ID" });
      return;
    }

    const [attachment] = await db
      .select()
      .from(attachmentsTable)
      .where(eq(attachmentsTable.id, id));

    if (!attachment) {
      res.status(404).json({ error: "Attachment not found" });
      return;
    }

    const buffer = Buffer.from(attachment.fileData, "base64");
    res.setHeader("Content-Type", attachment.mimeType);
    res.setHeader("Content-Disposition", `inline; filename="${attachment.fileName}"`);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Internal Server Error" });
  }
});

// Get attachment metadata
router.get("/attachments/:id/metadata", async (req, res): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid attachment ID" });
      return;
    }

    const [attachment] = await db
      .select({
        id: attachmentsTable.id,
        fileName: attachmentsTable.fileName,
        mimeType: attachmentsTable.mimeType,
        createdAt: attachmentsTable.createdAt,
      })
      .from(attachmentsTable)
      .where(eq(attachmentsTable.id, id));

    if (!attachment) {
      res.status(404).json({ error: "Attachment not found" });
      return;
    }

    res.json(attachment);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Internal Server Error" });
  }
});

export default router;
