import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/current-user';
import { generateQuestions } from '@/lib/feynman';
import { feynmanSessionSchema } from '@/lib/validations/feynman';
import { apiError, handleZodError, withErrorHandler } from '@/lib/api-error';
import { getRatelimit, getIp, rateLimitResponse } from '@/lib/ratelimit';

export const POST = withErrorHandler(async (request) => {
  // Upstash rate limit (works across all Vercel serverless instances)
  const ip = getIp(request);
  const { success, limit, remaining, reset } = await getRatelimit().limit(`feynman:${ip}`);
  if (!success) {
    return rateLimitResponse(limit, remaining, reset);
  }

  const user = await getCurrentUser();
  if (!user) {
    return apiError('Unauthorized', 401);
  }

  const body = await request.json();
  const validation = feynmanSessionSchema.safeParse(body);

  if (!validation.success) {
    return handleZodError(validation.error);
  }

  const { topic, notes } = validation.data;

  // AI generates structured Q&A pairs from the notes
  const questionBank = await generateQuestions(topic, notes || '');

  if (!questionBank || questionBank.length === 0) {
    return apiError('Failed to generate questions. Please try a different topic.', 500);
  }

  const totalQuestions = questionBank.length;

  // Create session with pre-generated question bank
  const session = await prisma.feynmanSession.create({
    data: {
      user_id: user.user_id,
      topic: topic,
      sourceNotes: notes || null,
      status: 'IN_PROGRESS',
      questionBank: questionBank,
      currentQuestionIndex: 0,
      score: 0,
      totalQuestions: totalQuestions,
      exchanges: {
        create: {
          role: 'ai',
          message: `🧠 Let's test your understanding of **${topic}** using the Feynman Technique!\n\nI've analyzed the topic and prepared some questions. Ready?\n\n**Question 1/${totalQuestions}:**\n${questionBank[0].question}`,
          order: 0,
        }
      }
    },
    include: {
      exchanges: {
        orderBy: { order: 'asc' }
      }
    }
  });

  return NextResponse.json({
    success: true,
    session: {
      id: session.id,
      topic: session.topic,
      status: session.status,
      totalQuestions: session.totalQuestions,
      exchanges: session.exchanges,
      createdAt: session.createdAt,
    }
  });
});

