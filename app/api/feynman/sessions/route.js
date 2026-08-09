import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/current-user';
import {cachedJsonResponse} from '@/lib/cache-headers';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessions = await prisma.feynmanSession.findMany({
      where: {
        user_id: user.user_id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        exchanges: {
          orderBy: { order: 'asc' },
          take: 1, // Just to know if there are exchanges
        },
        _count: {
          select: { exchanges: true }
        }
      }
    });

    return cachedJsonResponse({
      success: true,
      sessions: sessions.map(s => ({
        id: s.id,
        topic: s.topic,
        status: s.status,
        xpEarned: s.xpEarned,
        exchanges: s.exchanges,
        exchangeCount: s._count.exchanges,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
    });

  } catch (error) {
    console.error('Feynman sessions list error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}
