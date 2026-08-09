-- AlterTable
ALTER TABLE "Todo" ADD COLUMN     "difficulty" TEXT NOT NULL DEFAULT 'Easy';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastTaskDate" TIMESTAMP(3),
ADD COLUMN     "level" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "streak" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "xp" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'task',
    "minutes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ActivityLog_userId_date_type_key" ON "ActivityLog"("userId", "date", "type");

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
