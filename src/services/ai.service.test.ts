import { test } from "node:test";
import assert from "node:assert/strict";
import { generateDescription, AiDraftError } from "./ai.service.js";

const input = {
  title: "Modern Toronto Condo",
  propertyType: "Condo",
  city: "Toronto",
  province: "ON",
  bedrooms: 2,
  bathrooms: 2,
  price: 650000,
  features: ["Balcony", "Indoor parking"],
  tone: "professional" as const,
};

test("draft generation sends server-side API key and returns reviewable text", async () => {
  const old = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = "local-test-key";
  try {
    let called = false;
    const mockFetch: typeof fetch = async (url, init) => {
      called = true;
      assert.match(String(url), /^https:\/\/generativelanguage\.googleapis\.com\//);
      assert.equal(init?.method, "POST");
      assert.equal((init?.headers as Record<string, string>)["x-goog-api-key"], "local-test-key");
      const data = JSON.parse(String(init?.body));
      assert.match(data.contents[0].parts[0].text, /Modern Toronto Condo/);
      return new Response(JSON.stringify({
        candidates: [{ content: { parts: [{ text: "Two-bedroom Toronto condominium featuring a balcony and indoor parking. Review all property details before publication." }] } }],
      }), { status: 200, headers: { "content-type": "application/json" } });
    };
    const result = await generateDescription(input, mockFetch);
    assert.equal(called, true);
    assert.match(result.draft, /Two-bedroom Toronto/);
    assert.equal(result.source, "ai");
  } finally {
    if (old === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = old;
  }
});

test("without Gemini key, creates a factual local template and never calls a provider", async () => {
  const old = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    const result = await generateDescription(input, async () => {
      throw new Error("External request must never happen without a key.");
    });
    assert.equal(result.model, "local-template-v1");
    assert.equal(result.source, "template");
    assert.match(result.draft, /Modern Toronto Condo/);
    assert.match(result.draft, /2 bedrooms/);
    assert.match(result.draft, /Balcony, Indoor parking/);
    assert.match(result.draft, /\\$650,000/);
    assert.doesNotMatch(result.draft, /nearby schools|safe neighborhood|guaranteed returns/i);
  } finally {
    if (old !== undefined) process.env.GEMINI_API_KEY = old;
  }
});

test("provider failures are translated into safe API errors", async () => {
  const old = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = "local-test-key";
  try {
    await assert.rejects(
      () => generateDescription(input, async () => new Response("", { status: 429 })),
      (error: unknown) => error instanceof AiDraftError && error.statusCode === 502,
    );
  } finally {
    if (old === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = old;
  }
});
