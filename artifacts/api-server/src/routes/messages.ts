import { Router } from "express";
import { db, directMessagesTable } from "@workspace/db";
import { eq, or, and, desc } from "drizzle-orm";
import { logger } from "../lib/logger";
import { requireAuth } from "../middlewares/auth";

const router = Router();

router.get("/messages", requireAuth, async (req: any, res) => {
  try {
    const { tab = "inbox" } = req.query;
    const userId = req.userId;

    let rows;
    if (tab === "sent") {
      rows = await db.select().from(directMessagesTable)
        .where(eq(directMessagesTable.senderId, userId))
        .orderBy(desc(directMessagesTable.createdAt))
        .limit(50);
    } else if (tab === "announcements") {
      rows = await db.select().from(directMessagesTable)
        .where(eq(directMessagesTable.messageType, "announcement"))
        .orderBy(desc(directMessagesTable.createdAt))
        .limit(50);
    } else {
      rows = await db.select().from(directMessagesTable)
        .where(or(eq(directMessagesTable.receiverId, userId), eq(directMessagesTable.receiverId, "all")))
        .orderBy(desc(directMessagesTable.createdAt))
        .limit(50);
    }

    res.json(rows);
  } catch (err) {
    logger.error({ err }, "Failed to list messages");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/messages", requireAuth, async (req: any, res) => {
  try {
    const {
      receiverId, subject, body, messageType = "student",
      attachmentUrl, attachmentName, attachmentType,
    } = req.body;
    if (!receiverId || !body?.trim() || !subject?.trim()) {
      res.status(400).json({ error: "receiverId, subject and body are required" });
      return;
    }
    const [msg] = await db.insert(directMessagesTable).values({
      senderId: req.userId,
      receiverId,
      senderName: "Student",
      subject: subject.trim(),
      body: body.trim(),
      messageType,
      attachmentUrl: attachmentUrl || null,
      attachmentName: attachmentName || null,
      attachmentType: attachmentType || null,
    }).returning();
    res.status(201).json(msg);
  } catch (err) {
    logger.error({ err }, "Failed to send message");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/messages/:id/read", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.update(directMessagesTable).set({ isRead: true }).where(
      and(eq(directMessagesTable.id, id), eq(directMessagesTable.receiverId, req.userId))
    );
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Failed to mark message read");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/messages/broadcast", requireAuth, async (req: any, res) => {
  try {
    const { subject, body, messageType = "announcement", attachmentUrl, attachmentName, attachmentType } = req.body;
    if (!body?.trim() || !subject?.trim()) {
      res.status(400).json({ error: "subject and body are required" });
      return;
    }
    const [msg] = await db.insert(directMessagesTable).values({
      senderId: req.userId,
      receiverId: "all",
      senderName: "Teacher",
      subject: subject.trim(),
      body: body.trim(),
      messageType,
      attachmentUrl: attachmentUrl || null,
      attachmentName: attachmentName || null,
      attachmentType: attachmentType || null,
    }).returning();
    res.status(201).json(msg);
  } catch (err) {
    logger.error({ err }, "Failed to broadcast message");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
