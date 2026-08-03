-- AlterTable
ALTER TABLE "User" ADD COLUMN     "autoMatchedBook" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "csManager" TEXT,
ADD COLUMN     "rhoCs" TEXT,
ADD COLUMN     "vertical" TEXT;

-- CreateTable
CREATE TABLE "SalesAlignment" (
    "id" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "subregion" TEXT NOT NULL,
    "hos" TEXT NOT NULL,
    "docp" TEXT NOT NULL,
    "team" TEXT NOT NULL,
    "sellerName" TEXT NOT NULL,
    "marketTeam" TEXT NOT NULL,
    "location" TEXT,
    "rhoCs" TEXT NOT NULL,
    "csManager" TEXT NOT NULL,
    "csmName" TEXT NOT NULL,
    "secondCsm" TEXT,
    "cpContractor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesAlignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SalesAlignment_csmName_idx" ON "SalesAlignment"("csmName");

-- CreateIndex
CREATE INDEX "SalesAlignment_secondCsm_idx" ON "SalesAlignment"("secondCsm");
