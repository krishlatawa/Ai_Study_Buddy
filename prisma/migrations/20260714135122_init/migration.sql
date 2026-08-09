-- CreateTable
CREATE TABLE "User" (
    "user_id" SERIAL NOT NULL,
    "Roll_no" INTEGER NOT NULL,
    "email" TEXT NOT NULL,
    "Name" TEXT NOT NULL,
    "School" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_Roll_no_key" ON "User"("Roll_no");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
