-- AlterTable
ALTER TABLE "MenuItemSize" DROP CONSTRAINT "MenuItemSize_pkey",
ADD CONSTRAINT "MenuItemSize_pkey" PRIMARY KEY ("itemId", "id");
