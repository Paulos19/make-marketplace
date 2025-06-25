/*
  Warnings:

  - A unique constraint covering the columns `[userId,productId]` on the table `ShortLink` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "ShortLink_userId_idx";

-- AlterTable
ALTER TABLE "ShortLink" ADD COLUMN     "productId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ShortLink_userId_productId_key" ON "ShortLink"("userId", "productId");

-- AddForeignKey
ALTER TABLE "ShortLink" ADD CONSTRAINT "ShortLink_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
