import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/current-user';
import { cachedJsonResponse } from '@/lib/cache-headers';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const quizzes = await prisma.quiz.findMany({
      where: { user_id: user.user_id },
      include: {
        _count: { select: { questions: true, attempts: true } },
        attempts: {
          orderBy: { completedAt: 'desc' },
          take: 1,
          select: { score: true, totalQuestions: true, completedAt: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return cachedJsonResponse({ quizzes }, { maxAge: 15, staleWhileRevalidate: 30 });

  } catch (error) {
    console.error('List quizzes error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quizzes' },
      { status: 500 }
    );
  }
}
