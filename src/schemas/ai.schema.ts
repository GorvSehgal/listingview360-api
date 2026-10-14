import { z } from "zod";

export const descriptionDraftSchema = z.object({
  title: z.string().trim().min(3).max(140),
  propertyType: z.string().trim().min(2).max(80),
  city: z.string().trim().min(2).max(80),
  province: z.string().trim().min(2).max(80),
  bedrooms: z.number().int().min(0).max(30),
  bathrooms: z.number().min(0).max(30),
  price: z.number().int().positive().max(2147483647).optional(),
  squareFeet: z.number().int().min(100).max(50000).optional(),
  features: z.array(z.string().trim().min(2).max(120)).max(15).default([]),
  tone: z.enum(["professional", "warm", "luxury"]).default("professional"),
}).strict();

export type DescriptionDraftInput = z.infer<typeof descriptionDraftSchema>;
