import type { Request, Response, NextFunction } from "express";
import { prisma } from "../config/database.js";
import { verifyAccessToken } from "../services/auth.service.js";

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const match = /^Bearer ([A-Za-z0-9_.-]+)$/i.exec(req.header("Authorization") ?? "");
  if (!match?.[1]) {
    res.status(401).json({ success: false, message: "Authentication required" });
    return;
  }
  let userId: number | null;
  try {
    userId = verifyAccessToken(match[1]);
  } catch {
    res.status(503).json({ success: false, message: "Authentication is not configured" });
    return;
  }
  if (userId === null) {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
    return;
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true, active: true },
  });
  if (!user?.active) {
    res.status(401).json({ success: false, message: "Account unavailable" });
    return;
  }
  req.authUser = { id: user.id, email: user.email, role: user.role };
  next();
}

export function requireRole(...roles: Array<"admin" | "realtor">) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.authUser) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }
    if (!roles.includes(req.authUser.role)) {
      res.status(403).json({ success: false, message: "Insufficient permissions" });
      return;
    }
    next();
  };
}
