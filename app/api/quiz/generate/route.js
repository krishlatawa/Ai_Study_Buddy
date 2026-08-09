import { NextResponse } from 'next/server';
import { generateQuizWithGemini } from '@/lib/gemini';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/current-user';
import { quizGenerateSchema } from '@/lib/validations/quiz';
import { getRatelimit, getIp, rateLimitResponse } from '@/lib/ratelimit';
import { normalizeQuizPayload } from '@/lib/quiz-normalizer';

export async function POST(request) {
  try {
    // Upstash rate limit (works across all Vercel serverless instances)
    const ip = getIp(request);
    const { success, limit, remaining, reset } = await getRatelimit().limit(`quiz-generate:${ip}`);
    if (!success) {
      return rateLimitResponse(limit, remaining, reset);
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = quizGenerateSchema.safeParse(body);

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      return NextResponse.json({ error: firstError.message }, { status: 400 });
    }

    const { notes } = validation.data;

    const generatedQuiz = await generateQuizWithGemini(notes);
    const normalizedQuiz = normalizeQuizPayload(generatedQuiz);

    if (process.env.NODE_ENV !== 'production') {
      console.log('[quiz-debug] generation route normalized payload', JSON.stringify({
        title: normalizedQuiz?.title,
        questionCount: normalizedQuiz?.questions?.length ?? 0,
        questions: normalizedQuiz?.questions?.map((question) => ({
          type: question?.type,
          question: question?.question,
          answerType: typeof question?.answer,
          answerValue: question?.answer,
          optionsType: Array.isArray(question?.options) ? 'array' : typeof question?.options,
        })) ?? []
      }, null, 2));
    }

    const quiz = await prisma.quiz.create({
      data: {
        title: normalizedQuiz.title,
        notes,
        user_id: user.user_id,
        questions: {
          create: normalizedQuiz.questions.map((q, index) => ({
            type: q.type,
            question: q.question,
            options: q.type === 'MCQ' ? q.options : null,
            answer: q.answer !== undefined && q.answer !== null ? q.answer : null,
            order: index,
          })),
        },
      },
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json({ success: true, quiz });

  } catch (error) {
    console.error('Quiz generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate quiz' },
      { status: 500 }
    );
  }
}

