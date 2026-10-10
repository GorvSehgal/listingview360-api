import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
const ACCESS_TOKEN_SECONDS = 60 * 60;
const ISSUER = "listingview360";
const AUDIENCE = "listingview360-api";
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;

function derivePassword(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(password, salt, 64, {
      N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P, maxmem: 64 * 1024 * 1024,
    }, (error, derived) => {
      if (error) reject(error);
      else resolve(derived);
    });
  });
}

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("JWT_SECRET must be configured with at least 32 random bytes");
  }
  return secret;
}

export async function hashPassword(password: string): Promise<string> {
  if (password.length < 12 || Buffer.byteLength(password, "utf8") > 128) {
    throw new Error("Password must be at least 12 characters and at most 128 bytes");
  }
  const salt = randomBytes(32);
  const derived = await derivePassword(password, salt);
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt" ||
    parts[1] !== String(SCRYPT_N) || parts[2] !== String(SCRYPT_R) ||
    parts[3] !== String(SCRYPT_P) || typeof parts[4] !== "string" ||
    typeof parts[5] !== "string" || !/^[A-Za-z0-9_-]+$/.test(parts[4]) ||
    !/^[A-Za-z0-9_-]+$/.test(parts[5])) {
    return false;
  }
  const salt = Buffer.from(parts[4], "base64url");
  const expected = Buffer.from(parts[5], "base64url");
  if (salt.length !== 32 || expected.length !== 64 || Buffer.byteLength(password, "utf8") > 128) return false;
  const actual = await derivePassword(password, salt);
  return timingSafeEqual(actual, expected);
}

export function issueAccessToken(userId: number): string {
  if (!Number.isSafeInteger(userId) || userId < 1) throw new Error("Invalid account ID");
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({
    iss: ISSUER,
    aud: AUDIENCE,
    sub: String(userId),
    iat: now,
    exp: now + ACCESS_TOKEN_SECONDS,
  })).toString("base64url");
  const signed = `${header}.${payload}`;
  const signature = createHmac("sha256", jwtSecret()).update(signed).digest("base64url");
  return `${signed}.${signature}`;
}

export function verifyAccessToken(token: string): number | null {
  if (token.length > 4096) return null;
  const parts = token.split(".");
  if (parts.length !== 3 || parts.some((part) => !/^[A-Za-z0-9_-]+$/.test(part))) {
    return null;
  }
  const [header, payload, signature] = parts as [string, string, string];
  const signed = `${header}.${payload}`;
  const expected = createHmac("sha256", jwtSecret()).update(signed).digest();
  const provided = Buffer.from(signature, "base64url");
  if (provided.length !== expected.length || !timingSafeEqual(expected, provided)) {
    return null;
  }
  try {
    const decodedHeader: unknown = JSON.parse(Buffer.from(header, "base64url").toString("utf8"));
    const decodedPayload: unknown = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!decodedHeader || typeof decodedHeader !== "object" || Array.isArray(decodedHeader) ||
        !("alg" in decodedHeader) || decodedHeader.alg !== "HS256" ||
        !("typ" in decodedHeader) || decodedHeader.typ !== "JWT" ||
        !decodedPayload || typeof decodedPayload !== "object" || Array.isArray(decodedPayload)) return null;
    const claims = decodedPayload as Record<string, unknown>;
    const now = Math.floor(Date.now() / 1000);
    if (claims.iss !== ISSUER || claims.aud !== AUDIENCE ||
        typeof claims.sub !== "string" || !/^[1-9][0-9]*$/.test(claims.sub) ||
        !Number.isSafeInteger(Number(claims.sub)) ||
        typeof claims.iat !== "number" || !Number.isInteger(claims.iat) ||
        typeof claims.exp !== "number" || !Number.isInteger(claims.exp) ||
        claims.iat > now + 60 || claims.exp <= now ||
        claims.exp <= claims.iat || claims.exp > claims.iat + ACCESS_TOKEN_SECONDS) return null;
    return Number(claims.sub);
  } catch {
    return null;
  }
}

export const accessTokenExpiresIn = ACCESS_TOKEN_SECONDS;
