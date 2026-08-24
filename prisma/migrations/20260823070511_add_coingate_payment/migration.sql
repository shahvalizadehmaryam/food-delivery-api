/*
  Warnings:

  - A unique constraint covering the columns `[coinGateOrderId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('STRIPE', 'COINGATE');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "coinGateCallbackToken" TEXT,
ADD COLUMN     "coinGateOrderId" TEXT,
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'STRIPE';

-- CreateIndex
CREATE UNIQUE INDEX "Order_coinGateOrderId_key" ON "Order"("coinGateOrderId");
