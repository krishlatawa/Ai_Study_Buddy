-- CreateTable
CREATE TABLE "FeynmanSession" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "topic" TEXT NOT NULL,
    "sourceNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "xpEarned" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeynmanSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeynmanExchange" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeynmanExchange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeakSpot" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "topic" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'FEYNMAN',
    "sessionId" TEXT,
    "strength" INTEGER NOT NULL DEFAULT 1,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeakSpot_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FeynmanSession" ADD CONSTRAINT "FeynmanSession_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeynmanExchange" ADD CONSTRAINT "FeynmanExchange_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "FeynmanSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeakSpot" ADD CONSTRAINT "WeakSpot_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeakSpot" ADD CONSTRAINT "WeakSpot_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "FeynmanSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
