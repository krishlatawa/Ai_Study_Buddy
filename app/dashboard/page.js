import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth";
import { prisma } from "../../lib/prisma";
import { calculateLevel, calculateStreak } from "../../lib/progress-utils.mjs";
import DashboardShell from "./dashboard-shell";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/signin");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { user_id: true, Name: true, email: true, xp: true, level: true, streak: true, lastTaskDate: true },
  });

  const profile = user
    ? {
        user_id: user.user_id,
        Name: user.Name,
        email: user.email,
        xp: user.xp,
        level: calculateLevel(user.xp),
        streak: calculateStreak(user.lastTaskDate),
        lastTaskDate: user.lastTaskDate,
      }
    : null;

  return <DashboardShell initialProfile={profile} userName={session.user.name || user?.Name || "student"} />;
}
