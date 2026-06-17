import { Router, type IRouter } from "express";
import { db, bookmarksTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { logger } from "../lib/logger";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/bookmarks", requireAuth, async (req: any, res) => {
  try {
    const rows = await db.select().from(bookmarksTable)
      .where(eq(bookmarksTable.userId, req.userId))
      .orderBy(desc(bookmarksTable.createdAt));
    res.json(rows.map(b => ({
      id: b.id, userId: b.userId, surahId: b.surahId, surahName: b.surahName,
      ayahNumber: b.ayahNumber, ayahText: b.ayahText, note: b.note ?? null, createdAt: b.createdAt,
    })));
  } catch (err) {
    logger.error({ err }, "Failed to list bookmarks");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/bookmarks", requireAuth, async (req: any, res) => {
  try {
    const { surahId, surahName, ayahNumber, ayahText, note } = req.body;
    const inserted = await db.insert(bookmarksTable).values({
      userId: req.userId, surahId, surahName: surahName ?? "", ayahNumber,
      ayahText: ayahText ?? "", note: note ?? null,
    }).returning();
    const b = inserted[0];
    res.status(201).json({
      id: b.id, userId: b.userId, surahId: b.surahId, surahName: b.surahName,
      ayahNumber: b.ayahNumber, ayahText: b.ayahText, note: b.note ?? null, createdAt: b.createdAt,
    });
  } catch (err) {
    logger.error({ err }, "Failed to create bookmark");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/bookmarks/:id", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) { res.status(400).json({ error: "Invalid bookmark ID" }); return; }
    await db.delete(bookmarksTable).where(and(eq(bookmarksTable.id, id), eq(bookmarksTable.userId, req.userId)));
    res.status(204).send();
  } catch (err) {
    logger.error({ err }, "Failed to delete bookmark");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
