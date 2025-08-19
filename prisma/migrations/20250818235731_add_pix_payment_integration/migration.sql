-- CreateEnum
CREATE TYPE "public"."PixPaymentStatus" AS ENUM ('PENDING', 'CONFIRMED');

-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('STRIPE', 'PIX');

-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "carousel_until" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."Purchase" ADD COLUMN     "paymentMethod" "public"."PaymentMethod" NOT NULL DEFAULT 'STRIPE',
ALTER COLUMN "stripePaymentIntentId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "public"."PixPayment" (
    "id" TEXT NOT NULL,
    "txid" TEXT NOT NULL,
    "status" "public"."PixPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,

    CONSTRAINT "PixPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PixWebhook" (
    "id" TEXT NOT NULL,
    "txid" TEXT NOT NULL,
    "endToEndId" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "horario" TIMESTAMP(3) NOT NULL,
    "pix" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PixWebhook_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PixPayment_txid_key" ON "public"."PixPayment"("txid");

-- CreateIndex
CREATE UNIQUE INDEX "PixPayment_purchaseId_key" ON "public"."PixPayment"("purchaseId");

-- CreateIndex
CREATE UNIQUE INDEX "PixWebhook_txid_key" ON "public"."PixWebhook"("txid");

-- AddForeignKey
ALTER TABLE "public"."PixPayment" ADD CONSTRAINT "PixPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PixPayment" ADD CONSTRAINT "PixPayment_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "public"."Purchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
