import { test } from "node:test";
import assert from "node:assert/strict";
import {
  hashPassword,
  verifyPassword,
  issueAccessToken,
  verifyAccessToken,
  accessTokenExpiresIn,
} from "./auth.service.js";

process.env.JWT_SECRET = "test-only-key-for-listingview360-authentication-0123456789";

test("passwords use salted scrypt and verify only the correct password", async () => {
  const first = await hashPassword("correct-horse-stable-battery");
  const second = await hashPassword("correct-horse-stable-battery");
  assert.notEqual(first, second);
  assert.equal(await verifyPassword("correct-horse-stable-battery", first), true);
  assert.equal(await verifyPassword("incorrect-password", first), false);
  assert.equal(await verifyPassword("correct-horse-stable-battery", "not-a-hash"), false);
});

test("rejects weak and excessively long passwords", async () => {
  await assert.rejects(() => hashPassword("too-short"));
  await assert.rejects(() => hashPassword("x".repeat(129)));
});

test("issues a signed token containing only a user ID", () => {
  const token = issueAccessToken(42);
  assert.equal(token.split(".").length, 3);
  assert.equal(verifyAccessToken(token), 42);
  const payload = JSON.parse(Buffer.from(token.split(".")[1]!, "base64url").toString("utf8"));
  assert.equal(payload.sub, "42");
  assert.equal(payload.exp - payload.iat, accessTokenExpiresIn);
  assert.equal(payload.role, undefined);
});

test("rejects altered and malformed tokens", () => {
  const valid = issueAccessToken(21);
  const chunks = valid.split(".");
  assert.equal(verifyAccessToken(`${chunks[0]}.${chunks[1]}.AAAA`), null);
  assert.equal(verifyAccessToken(valid + "."), null);
  assert.equal(verifyAccessToken("not-a-jwt"), null);
  assert.equal(verifyAccessToken(""), null);
});

test("fails closed without a valid signing secret", () => {
  const old = process.env.JWT_SECRET;
  try {
    process.env.JWT_SECRET = "short";
    assert.throws(() => issueAccessToken(1), /JWT_SECRET/);
    assert.throws(() => verifyAccessToken(issueAccessTokenWithSecretlessCheck()), /JWT_SECRET/);
  } finally {
    process.env.JWT_SECRET = old;
  }
});

function issueAccessTokenWithSecretlessCheck() {
  // Three valid base64url segments force validation of the signing secret.
  return "e30.e30.Zm9v";
}
