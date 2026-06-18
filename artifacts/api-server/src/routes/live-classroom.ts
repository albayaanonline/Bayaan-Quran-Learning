import { Router } from "express";
import { logger } from "../lib/logger";
import { requireAuth } from "../middlewares/auth";

const router = Router();

const in_memory_sessions: any[] = [];

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

router.get("/live-classroom/sessions", requireAuth, async (req: any, res) => {
  try {
    res.json(in_memory_sessions);
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

    let meetingUrl: string;
    if (platform === "jitsi") {
      meetingUrl = generateJitsiUrl(title);
    } else if (platform === "google_meet") {
      meetingUrl = generateGoogleMeetUrl();
    } else {
      meetingUrl = generateZoomUrl();
    }

    const session = {
      id: `s_${Date.now()}`,
      title,
      teacher: "You",
      subject: subject || "General",
      date,
      time,
      duration: parseInt(duration) || 60,
      maxStudents: parseInt(maxStudents) || 20,
      enrolledCount: 0,
      meetingUrl,
      status: "upcoming",
      description: description || "",
      createdBy: req.userId,
      createdAt: new Date().toISOString(),
    };

    in_memory_sessions.unshift(session);

    logger.info({ userId: req.userId, sessionId: session.id, platform }, "Live class session created");

    res.status(201).json(session);
  } catch (err) {
    logger.error({ err }, "Failed to create session");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/live-classroom/sessions/:id", requireAuth, async (req: any, res) => {
  const idx = in_memory_sessions.findIndex(s => s.id === req.params.id && s.createdBy === req.userId);
  if (idx === -1) {
    res.status(404).json({ error: "Session not found" });
    return;
  }
  in_memory_sessions.splice(idx, 1);
  res.json({ success: true });
});

export default router;
