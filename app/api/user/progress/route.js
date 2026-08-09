import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { calculateLevel, calculateStreak } from "@/lib/progress-utils.mjs";
import { cachedJsonResponse } from "@/lib/cache-headers";

function normalizeDate(date) {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized." }, { status: 401 });

  const profile = await prisma.user.findUnique({
    where: { user_id: user.user_id },
    select: {
      user_id: true,
      Name: true,
      email: true,
      xp: true,
      level: true,
      streak: true,
      lastTaskDate: true,
    },
  });

  if (!profile) return Response.json({ error: "User not found." }, { status: 404 });

  // Load activity logs via relation include for the user
  const userWithLogs = await prisma.user.findUnique({
    where: { user_id: user.user_id },
    include: {
      activityLogs: {
        select: { date: true, type: true, minutes: true },
        orderBy: { date: "desc" },
      },
    },
  });
  const activityLogs = userWithLogs?.activityLogs || [];

  // Leaderboard remains a separate query
  const leaderboardUsers = await prisma.user.findMany({
    select: { user_id: true, xp: true, Name: true },
    orderBy: { xp: "desc" },
  });

  const focusMinutes = activityLogs.filter((entry) => entry.type === "focus").reduce((total, entry) => total + entry.minutes, 0);
  const derivedStreak = calculateStreak(profile.lastTaskDate, new Date(), profile.streak);
  const rank = leaderboardUsers.findIndex((entry) => entry.user_id === profile.user_id) + 1;

  const normalizedProfile = {
    ...profile,
    level: calculateLevel(profile.xp),
    streak: derivedStreak,
    rank,
    focusMinutes,
    focusHours: Number((focusMinutes / 60).toFixed(1)),
    recentActivity: activityLogs.slice(0, 7),
  };

  return cachedJsonResponse({ profile: normalizedProfile }, { maxAge: 15, staleWhileRevalidate: 30 });
}

export async function POST(request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Unauthorized." }, { status: 401 });

  try {
    const body = await request.json();
    const amount = Number(body?.amount || 0);
    const source = body?.source || "quest";
    const focusMins = Number(body?.focusMinutes || 0);

    if (!Number.isFinite(amount) || amount <= 0) {
      return Response.json({ error: "A positive XP amount is required." }, { status: 400 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { user_id: user.user_id },
      select: { xp: true, level: true, streak: true, lastTaskDate: true },
    });

    const now = new Date();
    const nextXp = currentUser.xp + amount;
    const nextLevel = calculateLevel(nextXp);
    const nextLastTaskDate = source === "quest" ? now : currentUser.lastTaskDate;
    const nextStreak =
      source === "quest"
        ? calculateStreak(currentUser.lastTaskDate, now, currentUser.streak)
        : currentUser.streak;

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { user_id: user.user_id },
        data: { xp: nextXp, level: nextLevel, streak: nextStreak, lastTaskDate: nextLastTaskDate },
      });

      if (source === "focus") {
        const today = normalizeDate(now);
        await tx.activityLog.upsert({
          where: { userId_date_type: { userId: user.user_id, date: today, type: "focus" } },
          update: { minutes: { increment: focusMins || 25 } },
          create: { userId: user.user_id, date: today, type: "focus", minutes: focusMins || 25 },
        });
      }

      if (source === "quest") {
        const today = normalizeDate(now);
        await tx.activityLog.upsert({
          where: { userId_date_type: { userId: user.user_id, date: today, type: "task" } },
          update: { minutes: { increment: 5 } },
          create: { userId: user.user_id, date: today, type: "task", minutes: 5 },
        });
      }
    });

    // Build the same full profile shape as GET so the client always receives
    // rank, recentActivity, and focusHours — no matter the trigger source.
    const [activityLogs, leaderboardUsers] = await Promise.all([
      prisma.activityLog.findMany({
        where: { userId: user.user_id },
        select: { date: true, type: true, minutes: true },
        orderBy: { date: "desc" },
      }),
      prisma.user.findMany({
        select: { user_id: true, xp: true, Name: true },
        orderBy: { xp: "desc" },
      }),
    ]);

    const totalFocusMinutes = activityLogs
      .filter((entry) => entry.type === "focus")
      .reduce((total, entry) => total + entry.minutes, 0);

    const rank = leaderboardUsers.findIndex((entry) => entry.user_id === user.user_id) + 1;

    const profile = {
      user_id: user.user_id,
      xp: nextXp,
      level: nextLevel,
      streak: nextStreak,
      lastTaskDate: nextLastTaskDate,
      rank,
      focusMinutes: totalFocusMinutes,
      focusHours: Number((totalFocusMinutes / 60).toFixed(1)),
      recentActivity: activityLogs.slice(0, 7),
    };

    return Response.json({ profile });
  } catch (error) {
    console.error("Progress update error:", error);
    return Response.json({ error: "Unable to update progress." }, { status: 500 });
  }
}
