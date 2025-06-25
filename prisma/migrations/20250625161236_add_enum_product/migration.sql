-- CreateEnum
CREATE TYPE "ProductCondition" AS ENUM ('NEW', 'GOOD_CONDITION', 'USED', 'REFURBISHED', 'OTHER');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "condition" "ProductCondition" NOT NULL DEFAULT 'NEW';
