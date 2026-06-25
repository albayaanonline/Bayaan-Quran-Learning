import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";

export interface AuthRequest extends Request {
  userId: string;
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  // Dev-only test bypass: pass X-Test-User-Id header to simulate auth
  if (process.env.NODE_ENV === "development") {
    const testUserId = req.headers["x-test-user-id"] as string | undefined;
    if (testUserId) {
      (req as AuthRequest).userId = testUserId;
      next();
      return;
    }
  }
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  (req as AuthRequest).userId = userId;
  next();
}
