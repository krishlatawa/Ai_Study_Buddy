import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/current-user';
import { cachedJsonResponse } from '@/lib/cache-headers';

export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { quizId } = await params;

    const quiz = await prisma.quiz.findFirst({
      where: { 
        id: quizId,
        user_id: user.user_id 
      },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            type: true,
            question: true,
            options: true,
          }
        }
      }
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    return cachedJsonResponse({quiz},{maxAge:20,staleWhileRevalidate:40});

  } catch (error) {
    console.error('Fetch quiz error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quiz' },
      { status: 500 }
    );
  }
}