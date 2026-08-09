import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/current-user';
import { quizSubmitSchema } from '@/lib/validations/quiz';
import { getRatelimit, getIp, rateLimitResponse } from '@/lib/ratelimit';
import { evaluateAnswer } from '@/lib/quiz-normalizer';

export async function POST(request, { params }) {
  try {
    const ip = getIp(request);
    const { success, limit, remaining, reset } = await getRatelimit().limit(`quiz-submit:${ip}`);
    if (!success) {
      return rateLimitResponse(limit, remaining, reset);
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { quizId } = await params;
    const body = await request.json();

    if (process.env.NODE_ENV !== 'production') {
      console.log('🟢 Quiz submit payload →', JSON.stringify(body, null, 2));
    }

    const validation = quizSubmitSchema.safeParse(body);

    if (!validation.success) {
      const firstIssue = validation.error.issues?.[0];
      const message = firstIssue?.message || 'Invalid quiz submission payload';
      return NextResponse.json({ error: message }, { status: 400 });
    }

    let { answers, timeTaken } = validation.data;

    if (!answers) {
      answers = [];
    }

    if (!Array.isArray(answers)) {
      if (typeof answers === 'object' && answers !== null) {
        answers = Object.entries(answers).map(([questionId, answer]) => ({
          questionId,
          answer,
        }));
      } else {
        return NextResponse.json(
          { error: 'Invalid payload: answers should be an array or object' },
          { status: 400 }
        );
      }
    }

    const quiz = await prisma.quiz.findFirst({
      where: { id: quizId, user_id: user.user_id },
      include: { questions: { orderBy: { order: 'asc' } } },
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log('[quiz-debug] quiz loaded for grading', JSON.stringify({
        quizId: quiz?.id,
        questionCount: quiz?.questions?.length ?? 0,
        questions: quiz?.questions?.map((question) => ({
          id: question?.id,
          type: question?.type,
          answerType: typeof question?.answer,
          answerValue: question?.answer,
          optionsType: Array.isArray(question?.options) ? 'array' : typeof question?.options,
        })) ?? []
      }, null, 2));
    }

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    console.log(`\n========================================`);
    console.log(`🎯 [QUIZ SUBMIT EVALUATION] Quiz ID: ${quiz.id} | Total Questions: ${quiz.questions.length}`);
    console.log(`========================================`);

    let score = 0;
    const gradedAnswers = quiz.questions.map((question, idx) => {
      const answerObj = answers.find((a) => a.questionId === question.id) || {};
      const userAnswer = answerObj.answer ?? '';

      if (process.env.NODE_ENV !== 'production') {
        console.log(`🔍 [ID MATCH] DB Question ID: "${question.id}" | Found in client answers: ${answerObj.questionId ? 'YES' : 'NO'} | Client answer IDs: ${answers.map(a => a.questionId).join(', ')}`);
      }

      const { isCorrect, normalizedUserAnswer } = evaluateAnswer(question, userAnswer);

      console.log(`📌 Q${idx + 1} (${question.type}) → User: "${userAnswer}" | Stored DB Answer: "${question.answer}" | Correct: ${isCorrect}`);

      if (isCorrect) score++;

      return {
        questionId: question.id,
        question: question.question,
        type: question.type,
        userAnswer,
        isCorrect,
      };
    });

    console.log(`========================================`);
    console.log(`🏆 FINAL SCORE: ${score} / ${quiz.questions.length} (${Math.round((score / quiz.questions.length) * 100)}%)`);
    console.log(`========================================\n`);

    const percentage = Math.round((score / quiz.questions.length) * 100);
    const xpEarned = percentage >= 80 ? 50 : percentage >= 50 ? 25 : 10;

    const attempt = await prisma.$transaction(
      async (tx) => {
        const newAttempt = await tx.quizAttempt.create({
          data: {
            quizId: quiz.id,
            user_id: user.user_id,
            score,
            totalQuestions: quiz.questions.length,
            answers: gradedAnswers.map((a) => ({
              questionId: a.questionId,
              question: a.question,
              type: a.type,
              userAnswer: a.userAnswer ?? null,
              isCorrect: a.isCorrect,
            })),
            timeTaken: timeTaken || null,
          },
        });

        await tx.user.update({
          where: { user_id: user.user_id },
          data: { xp: { increment: xpEarned } },
        });

        return newAttempt;
      },
      { timeout: 15000 }
    );

    return NextResponse.json({
      success: true,
      attempt: {
        id: attempt.id,
        score,
        totalQuestions: quiz.questions.length,
        percentage,
        xpEarned,
        answers: gradedAnswers,
        timeTaken: attempt.timeTaken,
      },
    });
  } catch (error) {
    console.error('❌ Quiz submit error →', error);
    if (error.stack) console.error(error.stack);

    return NextResponse.json(
      {
        error: error.message || 'Failed to submit quiz',
        ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
      },
      { status: 500 }
    );
  }
}
