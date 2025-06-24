-- AlterTable
ALTER TABLE "AdminNotification" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'RESERVATION',
ALTER COLUMN "reservationId" DROP NOT NULL,
ALTER COLUMN "sellerId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN     "submissionStatus" TEXT NOT NULL DEFAULT 'AVAILABLE';
