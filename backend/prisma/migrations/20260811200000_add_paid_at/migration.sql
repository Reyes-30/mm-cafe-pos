-- AlterTable
ALTER TABLE "orders" ADD COLUMN "paidAt" TIMESTAMP(3);

-- Backfill: orders already completed were paid when marked COMPLETADA
UPDATE "orders" SET "paidAt" = "updatedAt" WHERE "status" = 'COMPLETADA';
