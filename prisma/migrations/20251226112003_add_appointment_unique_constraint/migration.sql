/*
  Warnings:

  - A unique constraint covering the columns `[userId,doctorId,date,time,status]` on the table `appointments` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "appointments_userId_date_status_idx" ON "appointments"("userId", "date", "status");

-- CreateIndex
CREATE INDEX "appointments_doctorId_date_time_idx" ON "appointments"("doctorId", "date", "time");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_userId_doctorId_date_time_status_key" ON "appointments"("userId", "doctorId", "date", "time", "status");
