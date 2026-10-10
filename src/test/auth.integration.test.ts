import { test } from "node:test";
import assert from "node:assert/strict";
import { hashPassword } from "../services/auth.service.js";

type ApiResponse = {
  success: boolean;
  data?: { id?: number; accessToken?: string; role?: string };
  message?: string;
};

test("realtors manage only their own property; admin controls legacy listings", {
  skip: process.env.RUN_DB_TESTS !== "true",
}, async () => {
  const { default: app } = await import("../app.js");
  const { prisma } = await import("../config/database.js");

  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}/api/v1`;

  const userIds: number[] = [];
  const propertyIds: number[] = [];
  const password = "secure-test-account-password-2026";

  async function send(
    method: string, endpoint: string, body?: unknown, token?: string,
  ): Promise<{ status: number; body: ApiResponse }> {
    const response = await fetch(base + endpoint, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: response.status, body: await response.json() as ApiResponse };
  }

  const listing = {
    title: "Test listing for authorization",
    address: "25 Test Street",
    city: "Toronto",
    province: "ON",
    postalCode: "M5V 2T6",
    listingType: "sale",
    price: 550000,
    bedrooms: 2,
    bathrooms: 2,
    propertyType: "Condo",
    description: "Automated integration test listing; not real inventory.",
    realtorName: "Integration Tester",
    images: ["https://example.com/house.jpg"],
    panoramas: [],
  } as const;

  try {
    const passwordHash = await hashPassword(password);
    const userA = await prisma.user.create({
      data: { email: "ci-agent-a@listingview360.example", passwordHash, role: "realtor" },
    });
    userIds.push(userA.id);
    const userB = await prisma.user.create({
      data: { email: "ci-agent-b@listingview360.example", passwordHash, role: "realtor" },
    });
    userIds.push(userB.id);
    const admin = await prisma.user.create({
      data: { email: "ci-admin@listingview360.example", passwordHash, role: "admin" },
    });
    userIds.push(admin.id);

    const noAuth = await send("POST", "/properties", listing);
    assert.equal(noAuth.status, 401);

    const invalidLogin = await send("POST", "/auth/login", {
      email: userA.email, password: "incorrect-password",
    });
    assert.equal(invalidLogin.status, 401);

    const loginA = await send("POST", "/auth/login", { email: userA.email, password });
    const loginB = await send("POST", "/auth/login", { email: userB.email, password });
    const loginAdmin = await send("POST", "/auth/login", { email: admin.email, password });
    assert.equal(loginA.status, 200);
    assert.equal(loginB.status, 200);
    assert.equal(loginAdmin.status, 200);
    const tokenA = loginA.body.data?.accessToken;
    const tokenB = loginB.body.data?.accessToken;
    const tokenAdmin = loginAdmin.body.data?.accessToken;
    assert.ok(tokenA);
    assert.ok(tokenB);
    assert.ok(tokenAdmin);

    const me = await send("GET", "/auth/me", undefined, tokenA);
    assert.equal(me.status, 200);
    assert.equal(me.body.data?.id, userA.id);
    assert.equal(me.body.data?.role, "realtor");

    const create = await send("POST", "/properties", listing, tokenA);
    assert.equal(create.status, 201);
    const propertyId = create.body.data?.id;
    assert.ok(propertyId);
    propertyIds.push(propertyId);
    const owner = await prisma.property.findUnique({ where: { id: propertyId } });
    assert.equal(owner?.ownerId, userA.id);

    const publicRead = await send("GET", `/properties/${propertyId}`);
    assert.equal(publicRead.status, 200);

    const badPrice = await send("PATCH", `/properties/${propertyId}`, { price: 1.5 }, tokenA);
    assert.equal(badPrice.status, 400);

    const otherEdit = await send("PATCH", `/properties/${propertyId}`, {
      title: "Unauthorized replacement",
    }, tokenB);
    assert.equal(otherEdit.status, 404);

    const otherDelete = await send("DELETE", `/properties/${propertyId}`, undefined, tokenB);
    assert.equal(otherDelete.status, 404);

    const ownEdit = await send("PATCH", `/properties/${propertyId}`, {
      price: 560000,
    }, tokenA);
    assert.equal(ownEdit.status, 200);

    const legacy = await prisma.property.create({ data: {
      ...listing,
      ownerId: null,
      images: { create: [{ url: "https://example.com/legacy.jpg" }] },
      panoramas: { create: [] },
    } });
    propertyIds.push(legacy.id);
    const legacyDenied = await send("PATCH", `/properties/${legacy.id}`, {
      price: 570000,
    }, tokenA);
    assert.equal(legacyDenied.status, 404);
    const adminEdit = await send("PATCH", `/properties/${legacy.id}`, {
      price: 580000,
    }, tokenAdmin);
    assert.equal(adminEdit.status, 200);
    const adminDelete = await send("DELETE", `/properties/${legacy.id}`, undefined, tokenAdmin);
    assert.equal(adminDelete.status, 200);

    await prisma.user.update({ where: { id: userA.id }, data: { active: false } });
    const disabled = await send("PATCH", `/properties/${propertyId}`, {
      price: 570000,
    }, tokenA);
    assert.equal(disabled.status, 401);
  } finally {
    try {
      await prisma.property.deleteMany({ where: { id: { in: propertyIds } } });
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
      });
      await prisma.$disconnect();
    }
  }
});
