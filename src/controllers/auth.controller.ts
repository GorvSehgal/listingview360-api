import type { Request, Response } from "express";
import { prisma } from "../config/database.js";
import { verifyPassword, hashPassword, issueAccessToken, accessTokenExpiresIn } from "../services/auth.service.js";
import type { z } from "zod";
import type { signupSchema } from "../schemas/auth.schema.js";

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as { email: string; password: string };
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    res.status(401).json({ success: false, message: "Invalid email or password" });
    return;
  }
  if (!user.active || user.approvalStatus !== "approved") {
    res.status(403).json({ success: false, message: user.approvalStatus === "pending" ? "Account pending administrator approval" : "Account is not active" });
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


type SignupInput = z.infer<typeof signupSchema>;

export async function registerRealtor(req: Request<{}, {}, SignupInput>, res: Response) {
  const { email, password, fullName, brokerage, licenseNumber } = req.body;
  // No signup request may supply the role, active flag or account-approval status.
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    res.status(409).json({ success: false, message: "An account with this email already exists." });
    return;
  }

  const passwordHash = await hashPassword(password);
  try {
    await prisma.user.create({
      data: {
        email, passwordHash, fullName, brokerage, licenseNumber,
        role: "realtor", active: false, approvalStatus: "pending",
      },
      select: { id: true },
    });
  } catch (error) {
    // Handle concurrent requests attempting to register the same email.
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      res.status(409).json({ success: false, message: "An account with this email already exists." });
      return;
    }
    throw error;
  }
  res.status(201).json({
    success: true,
    data: { message: "Registration received. Your account must be reviewed before you can sign in." },
  });
}

export async function getPendingRealtors(_req: Request, res: Response) {
  const users = await prisma.user.findMany({
    where: { role: "realtor", approvalStatus: "pending" },
    orderBy: { createdAt: "asc" },
    take: 100,
    select: {
      id: true, email: true, fullName: true, brokerage: true,
      licenseNumber: true, createdAt: true,
    },
  });
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({ success: true, data: users });
}

export async function reviewRealtor(
  req: Request<{ id: string }, {}, { status: "approved" | "rejected" }>,
  res: Response,
) {
  const id = Number(req.params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    res.status(400).json({ success: false, message: "Invalid realtor ID" });
    return;
  }
  const result = await prisma.user.updateMany({
    where: { id, role: "realtor", approvalStatus: "pending" },
    data: { approvalStatus: req.body.status, active: req.body.status === "approved" },
  });
  if (result.count === 0) {
    res.status(404).json({ success: false, message: "Pending realtor application not found" });
    return;
  }
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({ success: true, data: { id, approvalStatus: req.body.status } });
}

export async function changePassword(req: Request, res: Response) {
  const actor = req.authUser!;
  const body = req.body as { currentPassword: string; newPassword: string };
  const user = await prisma.user.findUnique({
    where: { id: actor.id }, select: { passwordHash: true },
  });
  if (!user || !(await verifyPassword(body.currentPassword, user.passwordHash))) {
    res.status(401).json({ success: false, message: "Current password is incorrect" }); return;
  }
  if (body.currentPassword === body.newPassword) {
    res.status(400).json({ success: false, message: "Choose a different password" }); return;
  }
  const passwordHash = await hashPassword(body.newPassword);
  await prisma.user.update({ where: { id: actor.id }, data: { passwordHash } });
  res.setHeader("Cache-Control","no-store");
  res.json({ success: true, data: { message: "Password changed. Use the new password next time you sign in." } });
}
