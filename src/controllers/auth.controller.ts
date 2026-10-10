import type { Request, Response } from "express";
import { prisma } from "../config/database.js";
import { verifyPassword, issueAccessToken, accessTokenExpiresIn } from "../services/auth.service.js";

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as { email: string; password: string };
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active || !(await verifyPassword(password, user.passwordHash))) {
    res.status(401).json({ success: false, message: "Invalid email or password" });
    return;
  }
  let token: string;
  try {
    token = issueAccessToken(user.id);
  } catch {
    res.status(503).json({ success: false, message: "Authentication is not configured" });
    return;
  }
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({
    success: true,
    data: {
      accessToken: token,
      tokenType: "Bearer",
      expiresIn: accessTokenExpiresIn,
      user: { id: user.id, email: user.email, role: user.role },
    },
  });
}

export function getCurrentUser(req: Request, res: Response) {
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({ success: true, data: req.authUser });
}
