import type { Request, Response } from "express";
import type { DescriptionDraftInput } from "../schemas/ai.schema.js";
import { AiDraftError, generateDescription } from "../services/ai.service.js";

export async function draftListingDescription(req: Request, res: Response) {
  try {
    const result = await generateDescription(req.body as DescriptionDraftInput);
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({
      success: true,
      data: { ...result, needsReview: true },
    });
  } catch (error: unknown) {
    if (error instanceof AiDraftError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
      return;
    }
    throw error;
  }
}
