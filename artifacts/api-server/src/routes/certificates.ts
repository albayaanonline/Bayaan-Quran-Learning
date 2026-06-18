import { Router } from "express";
import { db, certificatesTable, profilesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { logger } from "../lib/logger";
import { requireAuth } from "../middlewares/auth";
import { randomBytes } from "crypto";

const router = Router();

function generateVerificationCode(): string {
  return randomBytes(8).toString("hex").toUpperCase();
}

router.get("/certificates", requireAuth, async (req: any, res) => {
  try {
    const rows = await db.select().from(certificatesTable)
      .where(eq(certificatesTable.userId, req.userId))
      .orderBy(desc(certificatesTable.issuedAt));
    res.json(rows);
  } catch (err) {
    logger.error({ err }, "Failed to list certificates");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/certificates/issue", requireAuth, async (req: any, res) => {
  try {
    const { type, title, description, subject, metadata, examResultId } = req.body;

    const [cert] = await db.insert(certificatesTable).values({
      userId: req.userId,
      type: type || "completion",
      title,
      description,
      subject,
      metadata,
      examResultId,
      verificationCode: generateVerificationCode(),
    }).returning();

    res.status(201).json(cert);
  } catch (err) {
    logger.error({ err }, "Failed to issue certificate");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/certificates/verify/:code", async (req, res) => {
  try {
    const [cert] = await db.select().from(certificatesTable)
      .where(eq(certificatesTable.verificationCode, req.params.code.toUpperCase()))
      .limit(1);

    if (!cert) {
      res.status(404).json({ valid: false, message: "Certificate not found" });
      return;
    }

    if (cert.isRevoked) {
      res.json({ valid: false, message: "Certificate has been revoked" });
      return;
    }

    if (cert.expiresAt && cert.expiresAt < new Date()) {
      res.json({ valid: false, message: "Certificate has expired" });
      return;
    }

    const [profile] = await db.select().from(profilesTable)
      .where(eq(profilesTable.clerkId, cert.userId))
      .limit(1);

    res.json({
      valid: true,
      certificate: {
        ...cert,
        studentName: profile?.displayName ?? "Student",
      },
    });
  } catch (err) {
    logger.error({ err }, "Failed to verify certificate");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/certificates/:id", requireAuth, async (req: any, res) => {
  try {
    const id = parseInt(req.params.id);
    const [cert] = await db.select().from(certificatesTable)
      .where(eq(certificatesTable.id, id))
      .limit(1);
    if (!cert) { res.status(404).json({ error: "Not found" }); return; }
    res.json(cert);
  } catch (err) {
    logger.error({ err }, "Failed to get certificate");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
