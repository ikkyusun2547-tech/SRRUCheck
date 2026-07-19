/*
  Warnings:

  - Added the required column `academic_year` to the `credit_transfer_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `academic_year` to the `external_activity_requests` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "RequestStatus" ADD VALUE 'cancelled';

-- AlterTable
ALTER TABLE "credit_transfer_requests" ADD COLUMN     "academic_year" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "external_activity_requests" ADD COLUMN     "academic_year" INTEGER NOT NULL;
