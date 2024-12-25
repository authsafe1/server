-- DropIndex
DROP INDEX "Secret_privateKey_publicKey_organizationId_idx";

-- AlterTable
ALTER TABLE "Secret" ADD COLUMN     "apiKey" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX "Secret_privateKey_publicKey_apiKey_organizationId_idx" ON "Secret"("privateKey", "publicKey", "apiKey", "organizationId");
