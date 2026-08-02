-- CreateTable
CREATE TABLE "FlashDeal" (
    "id" SERIAL NOT NULL,
    "menuItemId" INTEGER NOT NULL,
    "sizeId" TEXT,
    "discountType" TEXT NOT NULL,
    "discountValue" DECIMAL(10,2) NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlashDeal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FlashDeal_isActive_startsAt_endsAt_idx" ON "FlashDeal"("isActive", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "FlashDeal_menuItemId_idx" ON "FlashDeal"("menuItemId");

-- AddForeignKey
ALTER TABLE "FlashDeal" ADD CONSTRAINT "FlashDeal_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
