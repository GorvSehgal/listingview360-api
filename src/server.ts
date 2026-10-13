import dotenv from "dotenv";
import app from "./app.js";
import { seedDemoProperties } from "./scripts/seed-demo.js";
import { prisma } from "./config/database.js";
import { hashPassword, issueAccessToken } from "./services/auth.service.js";

dotenv.config();

const PORT = Number(process.env.PORT || 3000);

// Optional one-time account provisioning via secret hosting environment variables.
// No credentials or password hashes may be logged, committed, or placed in URLs.
// Existing accounts are NEVER reset or promoted by this helper.
async function bootstrapAccounts() {
  const configured = [
    { email: process.env.BOOTSTRAP_ADMIN_EMAIL, password: process.env.BOOTSTRAP_ADMIN_PASSWORD, role: "admin" as const },
    { email: process.env.BOOTSTRAP_REALTOR_EMAIL, password: process.env.BOOTSTRAP_REALTOR_PASSWORD, role: "realtor" as const },
  ];
  for (const account of configured) {
    if (!account.email && !account.password) continue;
    const email = account.email?.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !account.password) {
      throw new Error(`Invalid bootstrap ${account.role} configuration`);
    }
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      console.info(`Bootstrap ${account.role}: existing account untouched`);
      continue;
    }
    const passwordHash = await hashPassword(account.password);
    await prisma.user.create({
      data: { email, passwordHash, role: account.role, active: true, approvalStatus: "approved" },
      select: { id: true },
    });
    console.info(`Bootstrap ${account.role}: account created`);
  }
  try {
    // Fail-safe warning only: do not reveal the JWT or its secret.
    issueAccessToken(1);
    console.info("Authentication signing configuration ready");
  } catch {
    console.warn("Authentication signing secret not configured; login tokens will not work.");
  }
}

async function start() {
  await bootstrapAccounts();
  // Explicit staging-only opt-in. Never clears existing records.
  if (process.env.SEED_DEMO_PROPERTIES === "true") {
    const result = await seedDemoProperties();
    console.info("Fictional demo properties checked:", result.created, "created;", result.existing, "already present");
  }

  app.listen(PORT, () => {
    console.log(`ListingView360 API is running on port ${PORT}`);
  });
}

start().catch((error: unknown) => {
  console.error("ListingView360 API startup failed:", error);
  process.exitCode = 1;
});
