/*
  Warnings:

  - A unique constraint covering the columns `[apiKey]` on the table `Secret` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Secret_apiKey_key" ON "Secret"("apiKey");
