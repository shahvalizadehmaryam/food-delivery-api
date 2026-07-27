-- AlterTable: add registration profile fields to User
ALTER TABLE "User" ADD COLUMN "lastname" TEXT;
ALTER TABLE "User" ADD COLUMN "state" TEXT;
ALTER TABLE "User" ADD COLUMN "city" TEXT;
ALTER TABLE "User" ADD COLUMN "address" TEXT;
ALTER TABLE "User" ADD COLUMN "dob" DATE;
