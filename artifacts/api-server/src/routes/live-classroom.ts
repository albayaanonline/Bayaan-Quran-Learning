import { Router } from "express";
import { db, liveClassroomSessionsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { logger } from "../lib/logger";
import { requireAuth } from "../middlewares/auth";

const router = Router();

function generateJitsiUrl(title: string): string {
  const slug = title.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").slice(0, 40);
  return `https://meet.jit.si/albayaan-${slug}-${Date.now().toString(36)}`;
}

function generateGoogleMeetUrl(): string {
  return `https://meet.google.com/new`;
}

function generateZoomUrl(): string {
  return `https://zoom.us/start/videomeeting`;
}

function formatSession(s: any) {
  return {
    id: s.sessionKey,
    dbId: s.id,
    title: s.title,
    teacher: "Teacher",
    subject: s.subject,
    date: s.date,
    time: s.time,
    duration: s.duration,
    maxStudents: s.maxStudents,
    enrolledCount: s.enrolledCount,
    meetingUrl: s.meetingUrl,
    platform: s.platform,
    status: s.status,
    description: s.description,
    createdBy: s.createdBy,
    createdAt: s.createdAt,
  };
}

router.get("/live-classroom/sessions", requireAuth, async (req: any, res) => {
  try {
    const rows = await db
      .select()
      .from(liveClassroomSessionsTable)
      .orderBy(desc(liveClassroomSessionsTable.createdAt))
      .limit(50);
    res.json(rows.map(formatSession));
  } catch (err) {
    logger.error({ err }, "Failed to get sessions");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/live-classroom/sessions", requireAuth, async (req: any, res) => {
  try {
    const { title, subject, date, time, duration, maxStudents, description, platform } = req.body;

    if (!title || !date || !time) {
      res.status(400).json({ error: "title, date, and time are required" });
      return;
    }

    const safePlatform = platform || "jitsi";
    let meetingUrl: string;
    if (safePlatform === "jitsi") {
      meetingUrl = generateJitsiUrl(title);
    } else if (safePlatform === "google_meet") {
      meetingUrl = generateGoogleMeetUrl();
    } else {
      meetingUrl = generateZoomUrl();
    }

    const sessionKey = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const [session] = await db
      .insert(liveClassroomSessionsTable)
      .values({
        sessionKey,
        title,
        createdBy: req.userId,
        subject: subject || "General",
        description: description || "",
        date,
        time,
        duration: parseInt(duration) || 60,
        maxStudents: parseInt(maxStudents) || 20,
        meetingUrl,
        platform: safePlatform,
        status: "upcoming",
      })
      .returning();

    logger.info({ userId: req.userId, sessionKey, platform: safePlatform }, "Live class session created");
    res.status(201).json(formatSession(session));
  } catch (err) {
    logger.error({ err }, "Failed to create session");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/live-classroom/sessions/:sessionKey/status", requireAuth, async (req: any, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["upcoming", "live", "ended", "cancelled"];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }
    const [updated] = await db
      .update(liveClassroomSessionsTable)
      .set({ status })
      .where(
        and(
          eq(liveClassroomSessionsTable.sessionKey, req.params.sessionKey),
          eq(liveClassroomSessionsTable.createdBy, req.userId)
        )
      )
      .returning();
    if (!updated) { res.status(404).json({ error: "Session not found" }); return; }
    res.json(formatSession(updated));
  } catch (err) {
    logger.error({ err }, "Failed to update session status");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/live-classroom/sessions/:sessionKey", requireAuth, async (req: any, res) => {
  try {
    const deleted = await db
      .delete(liveClassroomSessionsTable)
      .where(
        and(
          eq(liveClassroomSessionsTable.sessionKey, req.params.sessionKey),
          eq(liveClassroomSessionsTable.createdBy, req.userId)
        )
      )
      .returning();
    if (deleted.length === 0) {
      res.status(404).json({ error: "Session not found or not authorized" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Failed to delete session");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
