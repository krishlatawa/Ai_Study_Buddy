-- AlterTable
ALTER TABLE "FeynmanExchange" ADD COLUMN     "isCorrect" BOOLEAN,
ADD COLUMN     "questionRef" INTEGER;

-- AlterTable
ALTER TABLE "FeynmanSession" ADD COLUMN     "currentQuestionIndex" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "questionBank" JSONB,
ADD COLUMN     "score" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalQuestions" INTEGER NOT NULL DEFAULT 0;
