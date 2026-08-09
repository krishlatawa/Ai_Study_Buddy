import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/current-user';
import { cachedJsonResponse } from '@/lib/cache-headers';

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const weakSpots = await prisma.weakSpot.findMany({
      where: {
        user_id: user.user_id,
      },
      orderBy: [
        { strength: 'asc' },
        { createdAt: 'desc' }
      ],
      include: {
        session: {
          select: {
            id: true,
            topic: true,
            status: true,
          }
        }
      }
    });

    return cachedJsonResponse({
      success: true,
      weakSpots: weakSpots,
    }, { maxAge: 15, staleWhileRevalidate: 30 });

  } catch (error) {
    console.error('Weak spots fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch weak spots' },
      { status: 500 }
    );
  }
}