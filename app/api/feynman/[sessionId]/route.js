import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/current-user';

export async function GET(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await params;

    const session = await prisma.feynmanSession.findFirst({
      where: {
        id: sessionId,
        user_id: user.user_id,
      },
      include: {
        exchanges: {
          orderBy: { order: 'asc' }
        },
        weakSpots: true,
      }
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        topic: session.topic,
        status: session.status,
        xpEarned: session.xpEarned,
        questionBank: session.questionBank,
        currentQuestionIndex: session.currentQuestionIndex,
        score: session.score,
        totalQuestions: session.totalQuestions,
        exchanges: session.exchanges,
        weakSpots: session.weakSpots,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      }
    });

  } catch (error) {
    console.error('Feynman session fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await params;
    const { action } = await request.json();

    if (action !== 'abandon') {
      return NextResponse.json(
        { error: 'Invalid action. Only "abandon" is supported.' },
        { status: 400 }
      );
    }

    const session = await prisma.feynmanSession.findFirst({
      where: {
        id: sessionId,
        user_id: user.user_id,
      }
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'Session is already completed or abandoned' },
        { status: 400 }
      );
    }

    await prisma.feynmanSession.update({
      where: { id: session.id },
      data: { status: 'ABANDONED' }
    });

    return NextResponse.json({
      success: true,
      message: 'Session abandoned',
    });

  } catch (error) {
    console.error('Feynman session update error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update session' },
      { status: 500 }
    );
  }
}
