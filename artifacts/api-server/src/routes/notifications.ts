import { Router } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { logger } from "../lib/logger";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.get("/notifications", requireAuth, async (req: any, res) => {
  try {
    const rows = await db.select().from(notificationsTable)
      .where(eq(notificationsTable.userId, req.userId))
      .orderBy(desc(notificationsTable.createdAt))
      .limit(50);
    res.json(rows);
  } catch (err) {
    logger.error({ err }, "Failed to get notifications");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/notifications/unread-count", requireAuth, async (req: any, res) => {
  try {
    const rows = await db.select().from(notificationsTable)
      .where(and(eq(notificationsTable.userId, req.userId), eq(notificationsTable.isRead, false)));
    res.json({ count: rows.length });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/notifications", requireAuth, async (req: any, res) => {
  try {
    const { userId, type, title, message, data } = req.body;
    const targetUserId = userId ?? req.userId;
    const [notif] = await db.insert(notificationsTable).values({
      userId: targetUserId, type, title, message, data,
    }).returning();
    res.status(201).json(notif);
  } catch (err) {
    logger.error({ err }, "Failed to create notification");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/notifications/:id/read", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const [updated] = await db.update(notificationsTable)
      .set({ isRead: true })
      .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, req.userId)))
      .returning();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/notifications/read-all", requireAuth, async (req: any, res) => {
  try {
    await db.update(notificationsTable)
      .set({ isRead: true })
      .where(eq(notificationsTable.userId, req.userId));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/notifications/:id", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(notificationsTable)
      .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, req.userId)));
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

/** Internal helper — create a notification for a user (called from other routes) */
export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  data?: Record<string, unknown>
): Promise<void> {
  try {
    await db.insert(notificationsTable).values({ userId, type, title, message, data });
  } catch (err) {
    logger.error({ err }, "Failed to auto-create notification");
  }
}

export default router;
