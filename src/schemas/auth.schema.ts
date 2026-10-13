import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(128),
}).strict();


const optionalProfileText = (max: number) =>
  z.string().trim().max(max).optional().transform((value) => value || undefined);

export const signupSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(12).max(128).refine((value) => Buffer.byteLength(value, "utf8") <= 128, {
    message: "Password must not exceed 128 bytes",
  }),
  brokerage: optionalProfileText(120),
  licenseNumber: optionalProfileText(64),
}).strict();

export const reviewRealtorSchema = z.object({
  status: z.enum(["approved", "rejected"]),
}).strict();
