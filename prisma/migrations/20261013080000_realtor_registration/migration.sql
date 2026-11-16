-- Accounts created by existing administrator scripts remain approved.
-- Public realtor self-registrations will explicitly set pending + inactive.
CREATE TYPE "RealtorApprovalStatus" AS ENUM ('pending', 'approved', 'rejected');
ALTER TABLE "User"
  ADD COLUMN "approvalStatus" "RealtorApprovalStatus" NOT NULL DEFAULT 'approved',
  ADD COLUMN "fullName" TEXT,
  ADD COLUMN "brokerage" TEXT,
  ADD COLUMN "licenseNumber" TEXT;
CREATE INDEX "User_role_approvalStatus_idx" ON "User"("role", "approvalStatus");