-- AlterTable
ALTER TABLE "Lot" ADD COLUMN     "externalSku" TEXT,
ADD COLUMN     "externalUrl" TEXT,
ADD COLUMN     "sourceCondition" TEXT,
ADD COLUMN     "sourceDelivery" TEXT,
ADD COLUMN     "sourceOriginalPriceCents" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Lot_externalSku_key" ON "Lot"("externalSku");
