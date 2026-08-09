"use client";

import PropTypes from "prop-types";
import { getRankDetails } from "@/lib/progress-utils.mjs";

export default function DashboardStatsHeader({ profile, leveledUp = false }) {
  const level = profile?.level ?? 1;
  const xp = profile?.xp ?? 0;
  const streak = profile?.streak ?? 0;
  const focusHours = profile?.focusHours ?? 0;
  const rank = profile?.rank ?? 1;

  // Show progress within the current level only (each level = 100 XP)
  const xpInLevel = xp - (level - 1) * 100;
  const xpGoal = 100;
  const progressPercent = Math.min(100, Math.max(0, Math.round((xpInLevel / xpGoal) * 100)));

  const rankInfo = getRankDetails(xp, level);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[color:var(--surface)] bg-[color:var(--surface)]/90 p-6 shadow-[0_0_30px_rgba(0,0,0,0.25)]">

      {/* Level-Up Celebration Banner */}
      {leveledUp && (
        <div className="animate-float-xp absolute inset-x-0 top-0 z-10 flex items-center justify-center gap-3 rounded-t-2xl bg-[color:var(--accent-primary)]/20 py-3 text-center backdrop-blur-sm">
          <span className="text-xl">🎉</span>
          <p className="text-sm font-black uppercase tracking-[0.3em] text-[color:var(--accent-primary)]" style={{ fontFamily: "var(--theme-font-display)" }}>
            Level Up! • Level {level}
          </p>
          <span className="text-xl">🎉</span>
        </div>
      )}

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--accent-info)]">Student Profile</p>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${rankInfo.badgeColor}`}>
              {rankInfo.emoji} {rankInfo.tier} Tier
            </span>
          </div>

          <h2 className="mt-2 text-2xl font-black text-white" style={{ fontFamily: "var(--theme-font-display)" }}>
            Level {level} • {rankInfo.title}
          </h2>
          <p className="mt-2 text-sm text-slate-300">Keep the streak alive and climb the leaderboard.</p>
        </div>

        <div className="flex flex-1 flex-col gap-4 lg:max-w-xl">
          <div className="flex items-center justify-between text-sm text-slate-300">
            <span>XP Progress — Level {level}</span>
            <span className="font-semibold text-white">{xpInLevel}/{xpGoal} XP</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-[#0B0F14]">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%`, backgroundColor: "var(--accent-primary)" }}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-[#0B0F14]/70 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Current streak</p>
              <p className="mt-2 text-2xl font-black text-white">{streak} {streak === 1 ? "day" : "days"}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#0B0F14]/70 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Weekly rank</p>
              <p className="mt-2 text-2xl font-black text-white">#{rank}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#0B0F14]/70 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Focus hours</p>
              <p className="mt-2 text-2xl font-black text-white">{focusHours}h</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

DashboardStatsHeader.propTypes = {
  profile: PropTypes.shape({
    level: PropTypes.number,
    xp: PropTypes.number,
    streak: PropTypes.number,
    rank: PropTypes.number,
    focusHours: PropTypes.number,
  }),
  leveledUp: PropTypes.bool,
};
