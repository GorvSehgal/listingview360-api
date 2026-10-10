import "dotenv/config";
import { prisma } from "../config/database.js";
import { hashPassword } from "../services/auth.service.js";

// Supply USER_EMAIL / USER_PASSWORD / USER_ROLE as environment variables,
// never password arguments (which may be retained in shell history).
async function main() {
  const email = process.env.USER_EMAIL?.trim().toLowerCase();
  const password = process.env.USER_PASSWORD;
  const role = process.env.USER_ROLE ?? "realtor";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      email.length > 254 || !password || !["admin", "realtor"].includes(role)) {
    throw new Error("Set valid USER_EMAIL, USER_PASSWORD (>=12 chars), USER_ROLE=admin|realtor");
  }
  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: role as "admin" | "realtor",
    },
    select: { id: true, email: true, role: true },
  });
  console.log("Created user", user.id, user.email, user.role);
}

main()
  .catch((error: unknown) => {
    console.error("Could not create account:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => { await prisma.$disconnect(); });
