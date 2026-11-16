import { createHash, randomUUID } from "node:crypto";
import { Router, json } from "express";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = Router();
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/** Never trust the declared MIME type: verify common image signatures too. */
function hasImageSignature(bytes: Buffer, type: string): boolean {
  if (type === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return bytes.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"));
  if (type === "image/webp") return bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP";
  return false;
}

router.post("/images", requireAuth, requireRole("admin", "realtor"), json({ limit: "8mb" }), async (req, res) => {
  const { cloudName, apiKey, apiSecret } = {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  };
  if (!cloudName || !apiKey || !apiSecret || !/^[A-Za-z0-9_-]+$/.test(cloudName)) {
    res.status(503).json({ success: false, message: "Image storage is not configured" });
    return;
  }

  const value: unknown = req.body;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    res.status(400).json({ success: false, message: "Invalid image request" });
    return;
  }
  const { dataUrl } = value as { dataUrl?: unknown };
  if (typeof dataUrl !== "string" || dataUrl.length > 7_100_000) {
    res.status(400).json({ success: false, message: "Invalid image payload" });
    return;
  }
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl);
  if (!match || !ALLOWED_TYPES.has(match[1]!)) {
    res.status(400).json({ success: false, message: "Only JPEG, PNG, and WebP images are supported" });
    return;
  }
  const image = Buffer.from(match[2]!, "base64");
  if (image.length === 0 || image.length > MAX_IMAGE_BYTES || !hasImageSignature(image, match[1]!)) {
    res.status(400).json({ success: false, message: "Image must be a valid JPEG, PNG or WebP under 5 MB" });
    return;
  }

  const publicId = randomUUID();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const folder = "listingview360/properties";
  const signature = createHash("sha1")
    .update(`folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");
  const form = new FormData();
  form.set("file", new Blob([image], { type: match[1] }), `${publicId}`);
  form.set("api_key", apiKey);
  form.set("timestamp", timestamp);
  form.set("folder", folder);
  form.set("public_id", publicId);
  form.set("signature", signature);
  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST", body: form, signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) {
      console.error("Cloud image upload failed:", response.status);
      res.status(502).json({ success: false, message: "Image storage is unavailable. Try again." });
      return;
    }
    const result: unknown = await response.json();
    const url = result && typeof result === "object" && "secure_url" in result ? result.secure_url : null;
    if (typeof url !== "string" || !url.startsWith(`https://res.cloudinary.com/${cloudName}/`)) {
      res.status(502).json({ success: false, message: "Invalid image storage response" });
      return;
    }
    res.status(201).json({ success: true, data: { url } });
  } catch (error) {
    console.error("Image storage request failed:", error instanceof Error ? error.name : "unknown");
    res.status(502).json({ success: false, message: "Image storage could not be reached" });
  }
});

export default router;
