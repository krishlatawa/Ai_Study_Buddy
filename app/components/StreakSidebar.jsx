import { useEffect, useState } from "react";
import PropTypes from "prop-types";

function formatDayLabel(date) {
  return date.toLocaleDateString("en-US", { weekday: "short" }).charAt(0);
}

export default function StreakSidebar({ profile }) {
  const [lastSevenDays, setLastSevenDays] = useState([]);

  // Build the date-based data only on the client after hydration
  // to avoid hydration mismatch between server and client Date.now()
  useEffect(() => {
    const now = new Date();
    const activity = new Set((profile?.recentActivity || []).map((entry) => new Date(entry.date).toDateString()));
    const days = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(now);
      day.setDate(now.getDate() - (6 - index));
      return { key: day.toDateString(), label: formatDayLabel(day), active: activity.has(day.toDateString()) };
    });
    setLastSevenDays(days);
  }, [profile?.recentActivity]);

  // Render a neutral placeholder on the server (before hydration)
  const isHydrated = lastSevenDays.length > 0;

  return (
    <aside className="rounded-2xl border border-[color:var(--surface)] bg-[color:var(--surface)]/90 p-6 shadow-[0_0_30px_rgba(0,0,0,0.25)]">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--accent-secondary)]">Weekly Pulse</p>
      <h3 className="mt-2 text-xl font-black text-white" style={{ fontFamily: "var(--theme-font-display)" }}>
        Streak calendar
      </h3>

      <div className="mt-6 grid grid-cols-7 gap-2">
        {lastSevenDays.map((day) => (
          <div key={day.key} className="flex flex-col items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{day.label}</span>
            <div className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold ${day.active ? "border-[color:var(--accent-primary)] bg-[color:var(--accent-primary)]/20 text-white" : "border-white/10 bg-[#0B0F14] text-slate-500"}`}>
              {day.active ? "✓" : "•"}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-white/10 bg-[#0B0F14]/70 p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Current streak</p>
        <p className="mt-2 text-3xl font-black text-white">{profile?.streak ?? 0} days</p>
      </div>
    </aside>
  );
}

StreakSidebar.propTypes = {
  profile: PropTypes.shape({
    streak: PropTypes.number,
    recentActivity: PropTypes.array,
  }),
};
