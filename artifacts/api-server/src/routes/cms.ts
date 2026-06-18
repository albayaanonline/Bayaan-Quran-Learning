import { Router } from "express";
import { db, cmsContentTable } from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { logger } from "../lib/logger";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.get("/cms/content", async (req, res) => {
  try {
    const { type, subject, level, featured } = req.query as Record<string, string>;
    let query = db.select().from(cmsContentTable).where(eq(cmsContentTable.isPublished, true));

    const rows = await db.select().from(cmsContentTable)
      .where(eq(cmsContentTable.isPublished, true))
      .orderBy(desc(cmsContentTable.createdAt));

    let filtered = rows;
    if (type) filtered = filtered.filter(r => r.type === type);
    if (subject) filtered = filtered.filter(r => r.subject === subject);
    if (level) filtered = filtered.filter(r => r.level === level || r.level === "all");
    if (featured === "true") filtered = filtered.filter(r => r.isFeatured);

    res.json(filtered);
  } catch (err) {
    logger.error({ err }, "Failed to list CMS content");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/cms/content/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [item] = await db.select().from(cmsContentTable).where(eq(cmsContentTable.id, id)).limit(1);
    if (!item) { res.status(404).json({ error: "Not found" }); return; }

    await db.update(cmsContentTable)
      .set({ viewCount: sql`${cmsContentTable.viewCount} + 1` })
      .where(eq(cmsContentTable.id, id));

    res.json(item);
  } catch (err) {
    logger.error({ err }, "Failed to get CMS content");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/cms/content", requireAuth, async (req: any, res) => {
  try {
    const { type, title, description, subject, level, fileUrl, fileName, fileSize, fileMimeType, thumbnailUrl, content, tags, isPublished, isFeatured } = req.body;

    const [item] = await db.insert(cmsContentTable).values({
      type, title, description,
      subject: subject || "quran",
      level: level || "all",
      fileUrl, fileName, fileSize, fileMimeType, thumbnailUrl, content,
      tags,
      isPublished: isPublished ?? false,
      isFeatured: isFeatured ?? false,
      createdBy: req.userId,
    }).returning();

    res.status(201).json(item);
  } catch (err) {
    logger.error({ err }, "Failed to create CMS content");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/cms/content/:id", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;
    const [item] = await db.update(cmsContentTable)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(cmsContentTable.id, id))
      .returning();
    res.json(item);
  } catch (err) {
    logger.error({ err }, "Failed to update CMS content");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/cms/content/:id", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(cmsContentTable).where(eq(cmsContentTable.id, id));
    res.status(204).end();
  } catch (err) {
    logger.error({ err }, "Failed to delete CMS content");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/cms/content/:id/download", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.update(cmsContentTable)
      .set({ downloadCount: sql`${cmsContentTable.downloadCount} + 1` })
      .where(eq(cmsContentTable.id, id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
