import { test } from "node:test";
import assert from "node:assert/strict";
import { hashPassword } from "../services/auth.service.js";

test("blog approval workflow prevents unauthorized and premature publication", {
  skip: process.env.RUN_DB_TESTS !== "true",
}, async () => {
  const { default: app } = await import("../app.js");
  const { prisma } = await import("../config/database.js");
  const server = app.listen(0);
  await new Promise<void>(resolve => server.once("listening", resolve));
  const addr = server.address();
  assert.ok(addr && typeof addr !== "string");
  const base = `http://127.0.0.1:${addr.port}/api/v1`;
  const users: number[] = [], articles: number[] = [];
  const secret = "test-blog-password-2026";
  async function req(method: string, route: string, token?: string, body?: unknown) {
    const response = await fetch(base + route, {
      method,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { status: response.status, body: await response.json() as any };
  }
  try {
    const passwordHash = await hashPassword(secret);
    const admin = await prisma.user.create({ data: {
      email: "ci-blog-admin@listingview360.example", passwordHash, role: "admin",
    } });
    const realtor = await prisma.user.create({ data: {
      email: "ci-blog-realtor@listingview360.example", passwordHash, role: "realtor",
    } });
    users.push(admin.id, realtor.id);
    const adminLogin = await req("POST", "/auth/login", undefined, { email: admin.email, password: secret });
    const realtorLogin = await req("POST", "/auth/login", undefined, { email: realtor.email, password: secret });
    assert.equal(adminLogin.status, 200); assert.equal(realtorLogin.status, 200);
    const a = adminLogin.body.data.accessToken, r = realtorLogin.body.data.accessToken;
    const draft = {
      title: "Planning an Ontario home purchase",
      slug: "ci-blog-ontario-guide",
      excerpt: "Practical points to verify before beginning your homebuying search in Ontario.",
      category: "Buyer guides",
      body: "Start with financial preparation, review official guidance, and compare neighborhoods. Consult qualified experts about mortgages and legal documents.",
    };
    assert.equal((await req("POST", "/blog", undefined, draft)).status, 401);
    assert.equal((await req("POST", "/blog", r, draft)).status, 403);
    const created = await req("POST", "/blog", a, draft);
    assert.equal(created.status, 201);
    const id = created.body.data.id as number;
    articles.push(id);
    assert.equal((await req("GET", `/blog/${draft.slug}`)).status, 404);
    assert.equal((await req("GET", "/blog/manage", r)).status, 403);
    assert.equal((await req("POST", `/blog/${id}/publish`, a)).status, 409);
    const approved = await req("POST", `/blog/${id}/approve`, a);
    assert.equal(approved.status, 200);
    assert.equal(approved.body.data.status, "approved");
    const revised = await req("PATCH", `/blog/${id}`, a, { ...draft, title: "Updated Ontario purchase guide" });
    assert.equal(revised.status, 200);
    assert.equal(revised.body.data.status, "draft");
    assert.equal((await req("POST", `/blog/${id}/publish`, a)).status, 409);
    assert.equal((await req("POST", `/blog/${id}/approve`, a)).status, 200);
    const published = await req("POST", `/blog/${id}/publish`, a);
    assert.equal(published.status, 200);
    assert.equal(published.body.data.status, "published");
    const publicArticle = await req("GET", `/blog/${draft.slug}`);
    assert.equal(publicArticle.status, 200);
    assert.equal(publicArticle.body.data.title, "Updated Ontario purchase guide");
    assert.equal("createdById" in publicArticle.body.data, false);
    assert.equal((await req("PATCH", `/blog/${id}`, a, draft)).status, 409);
    assert.equal((await req("POST", `/blog/${id}/unpublish`, r)).status, 403);
    assert.equal((await req("POST", `/blog/${id}/unpublish`, a)).status, 200);
    assert.equal((await req("GET", `/blog/${draft.slug}`)).status, 404);
    const audit = await prisma.blogAudit.findMany({ where: { blogPostId: id } });
    assert.deepEqual(audit.map(item => item.action), ["create_draft", "approve", "edit_draft", "approve", "publish", "unpublish"]);
  } finally {
    await prisma.blogPost.deleteMany({ where: { id: { in: articles } } });
    await prisma.user.deleteMany({ where: { id: { in: users } } });
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    await prisma.$disconnect();
  }
});
